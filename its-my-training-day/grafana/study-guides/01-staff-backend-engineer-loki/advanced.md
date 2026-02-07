# Advanced: Staff Backend Engineer - Grafana Databases, Loki Ingest

This document covers advanced topics essential for the Staff Backend Engineer role at Grafana Labs. Building on fundamentals and intermediate knowledge, we explore Loki's internal architecture, distributed storage optimization, SRE practices, and infrastructure-as-code patterns. These skills are critical for leading the design and operation of large-scale distributed systems.

## Table of Contents

1. [Loki Architecture Deep Dive](#loki-architecture-deep-dive)
2. [Distributed Storage Optimization](#distributed-storage-optimization)
3. [SRE Practices and On-Call](#sre-practices-and-on-call)
4. [Infrastructure as Code](#infrastructure-as-code)
5. [Related Resources](#related-resources)

---

## Loki Architecture Deep Dive

Understanding Loki's internal architecture is essential for contributing to its development and operating it at scale. This section covers the ingester design, chunk storage, query optimization, multi-tenancy, and scaling strategies.

> **Related Resource**: For LGTM stack overview, see [LGTM Stack](../../shared-concepts/lgtm-stack.md)

### Ingester Design and Operation

The ingester is Loki's most critical component for the write path. It receives log entries, builds compressed chunks, and manages the write-ahead log (WAL) for durability.

#### Ingester Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INGESTER ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         INGESTER INSTANCE                                │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    WRITE-AHEAD LOG (WAL)                         │    │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │    │   │
│  │  │  │Segment 1│ │Segment 2│ │Segment 3│ │Segment N│               │    │   │
│  │  │  │ (Closed)│ │ (Closed)│ │ (Closed)│ │ (Active)│               │    │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    IN-MEMORY STREAMS                             │    │   │
│  │  │                                                                  │    │   │
│  │  │  Tenant: tenant-1                                               │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │    │   │
│  │  │  │ Stream: {job="api", namespace="prod"}                    │   │    │   │
│  │  │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                     │   │    │   │
│  │  │  │ │ Chunk 1 │ │ Chunk 2 │ │ Chunk 3 │ (Building)          │   │    │   │
│  │  │  │ │ (Flushed)│ │(Flushing)│ │ (Open)  │                     │   │    │   │
│  │  │  │ └─────────┘ └─────────┘ └─────────┘                     │   │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │    │   │
│  │  │                                                                  │    │   │
│  │  │  Tenant: tenant-2                                               │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │    │   │
│  │  │  │ Stream: {job="worker", namespace="staging"}              │   │    │   │
│  │  │  │ ┌─────────┐ ┌─────────┐                                 │   │    │   │
│  │  │  │ │ Chunk 1 │ │ Chunk 2 │ (Building)                      │   │    │   │
│  │  │  │ └─────────┘ └─────────┘                                 │   │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


#### Ingester Lifecycle States

| State | Description | Behavior |
|-------|-------------|----------|
| **PENDING** | Starting up, loading WAL | Not accepting writes |
| **JOINING** | Joining hash ring | Receiving ownership transfers |
| **ACTIVE** | Fully operational | Accepting writes and queries |
| **LEAVING** | Graceful shutdown initiated | Flushing chunks, transferring ownership |
| **UNHEALTHY** | Failed health checks | Removed from ring, data redistributed |

#### Ingester Implementation Patterns

```go
package ingester

import (
    "context"
    "sync"
    "time"

    "github.com/grafana/dskit/ring"
    "github.com/grafana/loki/pkg/logproto"
)

// Ingester manages log stream ingestion and chunk building
type Ingester struct {
    cfg        Config
    lifecycler *ring.Lifecycler
    
    // Per-tenant stream management
    instances    map[string]*instance
    instancesMtx sync.RWMutex
    
    // WAL for durability
    wal *WAL
    
    // Flush management
    flushQueues     []*flushQueue
    flushQueuesDone sync.WaitGroup
    
    // Metrics
    metrics *ingesterMetrics
}

// instance represents a single tenant's data
type instance struct {
    tenantID string
    
    // Stream management
    streams    map[string]*stream
    streamsMtx sync.RWMutex
    
    // Index for label queries
    index *streamIndex
    
    // Limits
    limiter *Limiter
}

// stream represents a single log stream (unique label set)
type stream struct {
    labels     labels.Labels
    labelsHash uint64
    
    // Chunk management
    chunks     []*chunkDesc
    chunksMtx  sync.RWMutex
    
    // Current chunk being built
    currentChunk *chunk
    
    // Ordering enforcement
    lastTimestamp time.Time
    
    // Rate limiting
    rateLimiter *rate.Limiter
}

// Push handles incoming log entries
func (i *Ingester) Push(ctx context.Context, req *logproto.PushRequest) (*logproto.PushResponse, error) {
    // Extract tenant ID from context
    tenantID, err := tenant.TenantID(ctx)
    if err != nil {
        return nil, err
    }
    
    // Get or create tenant instance
    inst := i.getOrCreateInstance(tenantID)
    
    // Validate and apply limits
    if err := inst.limiter.ValidatePush(req); err != nil {
        return nil, err
    }
    
    // Write to WAL first for durability
    if err := i.wal.Log(tenantID, req); err != nil {
        return nil, fmt.Errorf("WAL write failed: %w", err)
    }
    
    // Process each stream in the request
    for _, reqStream := range req.Streams {
        labels, err := parseLabels(reqStream.Labels)
        if err != nil {
            return nil, err
        }
        
        // Get or create stream
        stream := inst.getOrCreateStream(labels)
        
        // Append entries to stream
        for _, entry := range reqStream.Entries {
            if err := stream.Push(entry); err != nil {
                i.metrics.pushFailures.WithLabelValues(tenantID).Inc()
                return nil, err
            }
        }
    }
    
    return &logproto.PushResponse{}, nil
}

// Push appends an entry to the stream
func (s *stream) Push(entry logproto.Entry) error {
    s.chunksMtx.Lock()
    defer s.chunksMtx.Unlock()
    
    // Enforce timestamp ordering (with configurable tolerance)
    if entry.Timestamp.Before(s.lastTimestamp) {
        // Out-of-order handling based on configuration
        return ErrOutOfOrder
    }
    
    // Check if current chunk should be cut
    if s.shouldCutChunk(entry) {
        s.cutChunk()
    }
    
    // Append to current chunk
    if err := s.currentChunk.Append(entry); err != nil {
        return err
    }
    
    s.lastTimestamp = entry.Timestamp
    return nil
}

// shouldCutChunk determines if a new chunk should be started
func (s *stream) shouldCutChunk(entry logproto.Entry) bool {
    if s.currentChunk == nil {
        return true
    }
    
    // Cut based on size
    if s.currentChunk.UncompressedSize() >= s.cfg.ChunkTargetSize {
        return true
    }
    
    // Cut based on time span
    if entry.Timestamp.Sub(s.currentChunk.From()) >= s.cfg.MaxChunkAge {
        return true
    }
    
    // Cut based on entry count
    if s.currentChunk.EntryCount() >= s.cfg.MaxChunkEntries {
        return true
    }
    
    return false
}
```

#### Write-Ahead Log (WAL) Design

The WAL ensures durability by persisting log entries before acknowledging writes.

```go
package wal

import (
    "encoding/binary"
    "hash/crc32"
    "io"
    "os"
    "sync"
)

// WAL provides durable storage for log entries before chunk flush
type WAL struct {
    cfg Config
    
    // Current segment
    segment     *segment
    segmentMtx  sync.Mutex
    
    // Segment management
    segments    []*segment
    segmentsMtx sync.RWMutex
    
    // Checkpointing
    lastCheckpoint uint64
}

// segment represents a single WAL file
type segment struct {
    id     uint64
    file   *os.File
    size   int64
    closed bool
}

// Record format:
// | CRC32 (4 bytes) | Length (4 bytes) | Type (1 byte) | Data (variable) |
type Record struct {
    Type RecordType
    Data []byte
}

type RecordType byte

const (
    RecordTypeFull    RecordType = 0
    RecordTypeFirst   RecordType = 1
    RecordTypeMiddle  RecordType = 2
    RecordTypeLast    RecordType = 3
)

// Log writes a record to the WAL
func (w *WAL) Log(tenantID string, req *logproto.PushRequest) error {
    w.segmentMtx.Lock()
    defer w.segmentMtx.Unlock()
    
    // Serialize the record
    data, err := proto.Marshal(&WALRecord{
        TenantID: tenantID,
        Request:  req,
    })
    if err != nil {
        return err
    }
    
    // Check if we need a new segment
    if w.segment.size+int64(len(data)+9) > w.cfg.SegmentSize {
        if err := w.rotateSegment(); err != nil {
            return err
        }
    }
    
    // Write record with CRC
    return w.writeRecord(data)
}

func (w *WAL) writeRecord(data []byte) error {
    // Calculate CRC
    crc := crc32.ChecksumIEEE(data)
    
    // Write header
    header := make([]byte, 9)
    binary.BigEndian.PutUint32(header[0:4], crc)
    binary.BigEndian.PutUint32(header[4:8], uint32(len(data)))
    header[8] = byte(RecordTypeFull)
    
    if _, err := w.segment.file.Write(header); err != nil {
        return err
    }
    
    // Write data
    if _, err := w.segment.file.Write(data); err != nil {
        return err
    }
    
    // Sync to disk (configurable)
    if w.cfg.SyncOnWrite {
        if err := w.segment.file.Sync(); err != nil {
            return err
        }
    }
    
    w.segment.size += int64(len(header) + len(data))
    return nil
}

// Recover replays the WAL after a crash
func (w *WAL) Recover(handler func(tenantID string, req *logproto.PushRequest) error) error {
    for _, seg := range w.segments {
        if err := w.recoverSegment(seg, handler); err != nil {
            return err
        }
    }
    return nil
}

func (w *WAL) recoverSegment(seg *segment, handler func(string, *logproto.PushRequest) error) error {
    file, err := os.Open(seg.path)
    if err != nil {
        return err
    }
    defer file.Close()
    
    reader := bufio.NewReader(file)
    
    for {
        // Read header
        header := make([]byte, 9)
        if _, err := io.ReadFull(reader, header); err != nil {
            if err == io.EOF {
                break
            }
            return err
        }
        
        expectedCRC := binary.BigEndian.Uint32(header[0:4])
        length := binary.BigEndian.Uint32(header[4:8])
        
        // Read data
        data := make([]byte, length)
        if _, err := io.ReadFull(reader, data); err != nil {
            return err
        }
        
        // Verify CRC
        actualCRC := crc32.ChecksumIEEE(data)
        if actualCRC != expectedCRC {
            return fmt.Errorf("CRC mismatch: expected %d, got %d", expectedCRC, actualCRC)
        }
        
        // Deserialize and replay
        var record WALRecord
        if err := proto.Unmarshal(data, &record); err != nil {
            return err
        }
        
        if err := handler(record.TenantID, record.Request); err != nil {
            return err
        }
    }
    
    return nil
}
```


### Chunk Storage and Indexing

Loki's storage model separates index (metadata) from chunks (log data), enabling cost-effective scaling.

#### Chunk Format

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CHUNK FORMAT                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CHUNK STRUCTURE                                  │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ HEADER                                                          │    │   │
│  │  │ ┌─────────────┬─────────────┬─────────────┬─────────────┐      │    │   │
│  │  │ │ Magic (4B)  │ Version (1B)│ Encoding(1B)│ Blocks (4B) │      │    │   │
│  │  │ └─────────────┴─────────────┴─────────────┴─────────────┘      │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ BLOCKS (Compressed)                                             │    │   │
│  │  │ ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │ │ Block 0: [timestamp, line, timestamp, line, ...]        │    │    │   │
│  │  │ └─────────────────────────────────────────────────────────┘    │    │   │
│  │  │ ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │ │ Block 1: [timestamp, line, timestamp, line, ...]        │    │    │   │
│  │  │ └─────────────────────────────────────────────────────────┘    │    │   │
│  │  │ ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │ │ Block N: [timestamp, line, timestamp, line, ...]        │    │    │   │
│  │  │ └─────────────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ METADATA                                                        │    │   │
│  │  │ ┌─────────────┬─────────────┬─────────────┬─────────────┐      │    │   │
│  │  │ │ From (8B)   │ Through (8B)│ Checksum(4B)│ Labels Hash │      │    │   │
│  │  │ └─────────────┴─────────────┴─────────────┴─────────────┘      │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Chunk Implementation

```go
package chunk

import (
    "bytes"
    "encoding/binary"
    "hash/crc32"
    "time"

    "github.com/klauspost/compress/gzip"
    "github.com/klauspost/compress/snappy"
    "github.com/klauspost/compress/zstd"
)

// Encoding types for chunk compression
type Encoding byte

const (
    EncGZIP   Encoding = iota // Good compression, slower
    EncSnappy                  // Fast, moderate compression
    EncLZ4                     // Very fast, good compression
    EncZstd                    // Best compression ratio
)

// Chunk represents a compressed block of log entries
type Chunk struct {
    encoding Encoding
    
    // Time bounds
    from    time.Time
    through time.Time
    
    // Compressed blocks
    blocks []block
    
    // Current block being built
    currentBlock *blockBuilder
    
    // Metadata
    entries int
    size    int
}

type block struct {
    offset     int
    length     int
    numEntries int
    mint       int64
    maxt       int64
}

type blockBuilder struct {
    buf        bytes.Buffer
    entries    int
    mint, maxt int64
}

// NewChunk creates a new chunk with the specified encoding
func NewChunk(encoding Encoding) *Chunk {
    return &Chunk{
        encoding:     encoding,
        currentBlock: &blockBuilder{},
    }
}

// Append adds an entry to the chunk
func (c *Chunk) Append(ts time.Time, line string) error {
    tsNano := ts.UnixNano()
    
    // Update time bounds
    if c.from.IsZero() || ts.Before(c.from) {
        c.from = ts
    }
    if ts.After(c.through) {
        c.through = ts
    }
    
    // Write to current block
    // Format: varint(timestamp_delta) + varint(line_length) + line
    c.currentBlock.append(tsNano, line)
    c.entries++
    
    // Check if block should be cut
    if c.currentBlock.buf.Len() >= blockTargetSize {
        c.cutBlock()
    }
    
    return nil
}

func (b *blockBuilder) append(ts int64, line string) {
    // Delta encoding for timestamps
    var delta int64
    if b.entries == 0 {
        b.mint = ts
        delta = 0
    } else {
        delta = ts - b.maxt
    }
    b.maxt = ts
    
    // Write timestamp delta as varint
    var buf [binary.MaxVarintLen64]byte
    n := binary.PutVarint(buf[:], delta)
    b.buf.Write(buf[:n])
    
    // Write line length and content
    n = binary.PutUvarint(buf[:], uint64(len(line)))
    b.buf.Write(buf[:n])
    b.buf.WriteString(line)
    
    b.entries++
}

// cutBlock compresses and finalizes the current block
func (c *Chunk) cutBlock() error {
    if c.currentBlock.entries == 0 {
        return nil
    }
    
    // Compress the block
    compressed, err := c.compress(c.currentBlock.buf.Bytes())
    if err != nil {
        return err
    }
    
    c.blocks = append(c.blocks, block{
        offset:     c.size,
        length:     len(compressed),
        numEntries: c.currentBlock.entries,
        mint:       c.currentBlock.mint,
        maxt:       c.currentBlock.maxt,
    })
    
    c.size += len(compressed)
    c.currentBlock = &blockBuilder{}
    
    return nil
}

func (c *Chunk) compress(data []byte) ([]byte, error) {
    var buf bytes.Buffer
    
    switch c.encoding {
    case EncGZIP:
        w := gzip.NewWriter(&buf)
        if _, err := w.Write(data); err != nil {
            return nil, err
        }
        if err := w.Close(); err != nil {
            return nil, err
        }
    case EncSnappy:
        return snappy.Encode(nil, data), nil
    case EncZstd:
        encoder, _ := zstd.NewWriter(&buf)
        if _, err := encoder.Write(data); err != nil {
            return nil, err
        }
        if err := encoder.Close(); err != nil {
            return nil, err
        }
    default:
        return data, nil
    }
    
    return buf.Bytes(), nil
}

// Bytes serializes the chunk for storage
func (c *Chunk) Bytes() ([]byte, error) {
    // Finalize current block
    if err := c.cutBlock(); err != nil {
        return nil, err
    }
    
    var buf bytes.Buffer
    
    // Write header
    buf.Write([]byte{0x4C, 0x4F, 0x4B, 0x49}) // Magic: "LOKI"
    buf.WriteByte(1)                           // Version
    buf.WriteByte(byte(c.encoding))            // Encoding
    binary.Write(&buf, binary.BigEndian, uint32(len(c.blocks)))
    
    // Write block metadata
    for _, b := range c.blocks {
        binary.Write(&buf, binary.BigEndian, uint32(b.offset))
        binary.Write(&buf, binary.BigEndian, uint32(b.length))
        binary.Write(&buf, binary.BigEndian, uint32(b.numEntries))
        binary.Write(&buf, binary.BigEndian, b.mint)
        binary.Write(&buf, binary.BigEndian, b.maxt)
    }
    
    // Write compressed blocks
    // ... (block data)
    
    // Write checksum
    checksum := crc32.ChecksumIEEE(buf.Bytes())
    binary.Write(&buf, binary.BigEndian, checksum)
    
    return buf.Bytes(), nil
}
```

#### TSDB Index Schema

Loki uses a TSDB-style index for efficient label-based queries.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TSDB INDEX SCHEMA                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Index Structure:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  SERIES TABLE                                                           │   │
│  │  ┌─────────────┬─────────────────────────────────────────────────┐     │   │
│  │  │ Series ID   │ Labels                                          │     │   │
│  │  ├─────────────┼─────────────────────────────────────────────────┤     │   │
│  │  │ 1           │ {job="api", namespace="prod", pod="api-1"}      │     │   │
│  │  │ 2           │ {job="api", namespace="prod", pod="api-2"}      │     │   │
│  │  │ 3           │ {job="worker", namespace="staging"}             │     │   │
│  │  └─────────────┴─────────────────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  │  POSTING LISTS (Inverted Index)                                         │   │
│  │  ┌─────────────────────────┬─────────────────────────────────────┐     │   │
│  │  │ Label                   │ Series IDs                          │     │   │
│  │  ├─────────────────────────┼─────────────────────────────────────┤     │   │
│  │  │ job="api"               │ [1, 2]                              │     │   │
│  │  │ job="worker"            │ [3]                                 │     │   │
│  │  │ namespace="prod"        │ [1, 2]                              │     │   │
│  │  │ namespace="staging"     │ [3]                                 │     │   │
│  │  └─────────────────────────┴─────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  │  CHUNK REFERENCES                                                       │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────────────┐     │   │
│  │  │ Series ID   │ From        │ Through     │ Chunk Reference     │     │   │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────────────┤     │   │
│  │  │ 1           │ 1704067200  │ 1704070800  │ s3://bucket/chunk1  │     │   │
│  │  │ 1           │ 1704070800  │ 1704074400  │ s3://bucket/chunk2  │     │   │
│  │  │ 2           │ 1704067200  │ 1704074400  │ s3://bucket/chunk3  │     │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────────────────┘     │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Query Path Optimization

The query path in Loki involves multiple components working together to efficiently retrieve and filter log data.

#### Query Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           QUERY EXECUTION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Query Frontend                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Parse LogQL query                                                     │   │
│  │  • Split query by time (e.g., 24h query → 24 × 1h queries)              │   │
│  │  • Queue queries for execution                                           │   │
│  │  • Cache results (if enabled)                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  2. Query Scheduler                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Fair scheduling across tenants                                        │   │
│  │  • Priority queues for different query types                             │   │
│  │  • Rate limiting per tenant                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  3. Querier                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Resolve label matchers to series IDs (index lookup)                   │   │
│  │  • Identify relevant chunks (time range + series)                        │   │
│  │  • Fetch chunks from ingesters (recent) + object storage (historical)   │   │
│  │  • Decompress and filter log lines                                       │   │
│  │  • Apply pipeline stages (parsers, filters, formatters)                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  4. Result Merging                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Merge results from split queries                                      │   │
│  │  • Deduplicate (for replicated data)                                     │   │
│  │  • Sort by timestamp                                                     │   │
│  │  • Apply limits                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Query Optimization Techniques

```go
package querier

import (
    "context"
    "sort"
    "sync"
    "time"

    "github.com/grafana/loki/pkg/logproto"
    "github.com/grafana/loki/pkg/logql"
)

// QueryOptimizer applies optimizations to LogQL queries
type QueryOptimizer struct {
    cfg OptimizationConfig
}

type OptimizationConfig struct {
    // Query splitting
    SplitByInterval    time.Duration // Split queries into smaller time ranges
    MaxParallelQueries int           // Max concurrent sub-queries
    
    // Caching
    ResultsCacheEnabled bool
    ResultsCacheTTL     time.Duration
    
    // Bloom filters
    BloomFiltersEnabled bool
    
    // Chunk prefetching
    PrefetchChunks bool
}

// OptimizeQuery applies optimizations to a query
func (o *QueryOptimizer) OptimizeQuery(ctx context.Context, query string, start, end time.Time) (*OptimizedQuery, error) {
    // Parse the query
    expr, err := logql.ParseExpr(query)
    if err != nil {
        return nil, err
    }
    
    optimized := &OptimizedQuery{
        Original: query,
        Expr:     expr,
    }
    
    // 1. Push down filters to reduce data scanned
    optimized.Expr = o.pushDownFilters(expr)
    
    // 2. Split by time interval for parallelism
    optimized.TimeRanges = o.splitTimeRange(start, end)
    
    // 3. Identify bloom filter candidates
    if o.cfg.BloomFiltersEnabled {
        optimized.BloomFilterTerms = o.extractBloomTerms(expr)
    }
    
    // 4. Estimate query cost for scheduling
    optimized.EstimatedCost = o.estimateCost(expr, start, end)
    
    return optimized, nil
}

// pushDownFilters moves filter operations closer to data source
func (o *QueryOptimizer) pushDownFilters(expr logql.Expr) logql.Expr {
    // Example: Move line_format after filtering to reduce processing
    // Before: {job="api"} | line_format "{{.message}}" | json | level="error"
    // After:  {job="api"} | json | level="error" | line_format "{{.message}}"
    
    // This is a simplified example - actual implementation is more complex
    return expr
}

// splitTimeRange divides query into parallel sub-queries
func (o *QueryOptimizer) splitTimeRange(start, end time.Time) []TimeRange {
    var ranges []TimeRange
    
    current := start
    for current.Before(end) {
        rangeEnd := current.Add(o.cfg.SplitByInterval)
        if rangeEnd.After(end) {
            rangeEnd = end
        }
        
        ranges = append(ranges, TimeRange{
            Start: current,
            End:   rangeEnd,
        })
        
        current = rangeEnd
    }
    
    return ranges
}

// ExecuteParallel runs sub-queries in parallel and merges results
func (o *QueryOptimizer) ExecuteParallel(ctx context.Context, query *OptimizedQuery, executor QueryExecutor) (*logproto.QueryResponse, error) {
    results := make(chan *logproto.QueryResponse, len(query.TimeRanges))
    errors := make(chan error, len(query.TimeRanges))
    
    // Semaphore for limiting parallelism
    sem := make(chan struct{}, o.cfg.MaxParallelQueries)
    
    var wg sync.WaitGroup
    for _, tr := range query.TimeRanges {
        wg.Add(1)
        go func(timeRange TimeRange) {
            defer wg.Done()
            
            // Acquire semaphore
            sem <- struct{}{}
            defer func() { <-sem }()
            
            result, err := executor.Execute(ctx, query.Expr, timeRange.Start, timeRange.End)
            if err != nil {
                errors <- err
                return
            }
            results <- result
        }(tr)
    }
    
    // Wait for all queries to complete
    go func() {
        wg.Wait()
        close(results)
        close(errors)
    }()
    
    // Collect and merge results
    return o.mergeResults(results, errors)
}

// mergeResults combines results from parallel queries
func (o *QueryOptimizer) mergeResults(results <-chan *logproto.QueryResponse, errors <-chan error) (*logproto.QueryResponse, error) {
    var allStreams []*logproto.Stream
    
    for result := range results {
        allStreams = append(allStreams, result.Streams...)
    }
    
    // Check for errors
    for err := range errors {
        if err != nil {
            return nil, err
        }
    }
    
    // Merge streams with same labels
    merged := o.mergeStreams(allStreams)
    
    // Sort entries by timestamp
    for _, stream := range merged {
        sort.Slice(stream.Entries, func(i, j int) bool {
            return stream.Entries[i].Timestamp.Before(stream.Entries[j].Timestamp)
        })
    }
    
    return &logproto.QueryResponse{Streams: merged}, nil
}

// Bloom Filter Integration for Line Filtering
type BloomFilter struct {
    bits    []uint64
    numHash int
}

// CheckTerm quickly eliminates chunks that don't contain a search term
func (bf *BloomFilter) CheckTerm(term string) bool {
    for i := 0; i < bf.numHash; i++ {
        hash := bf.hash(term, i)
        idx := hash % uint64(len(bf.bits)*64)
        if bf.bits[idx/64]&(1<<(idx%64)) == 0 {
            return false // Definitely not present
        }
    }
    return true // Possibly present
}

func (bf *BloomFilter) hash(term string, seed int) uint64 {
    // Use multiple hash functions for bloom filter
    h := fnv.New64a()
    h.Write([]byte(term))
    h.Write([]byte{byte(seed)})
    return h.Sum64()
}
```

### Multi-Tenancy Implementation

Loki provides strong tenant isolation for multi-tenant deployments.

#### Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANCY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TENANT ISOLATION LAYERS                               │   │
│  │                                                                          │   │
│  │  1. Authentication & Authorization                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  X-Scope-OrgID Header → Tenant Identification                   │    │   │
│  │  │  Authentication: API Keys, OAuth, OIDC                          │    │   │
│  │  │  Authorization: RBAC per tenant                                 │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  2. Resource Isolation                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Per-Tenant Limits:                                             │    │   │
│  │  │  • Ingestion rate (MB/s)                                        │    │   │
│  │  │  • Active streams                                               │    │   │
│  │  │  • Query concurrency                                            │    │   │
│  │  │  • Storage quota                                                │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  3. Data Isolation                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Storage Path: /{tenant_id}/chunks/...                          │    │   │
│  │  │  Index Prefix: {tenant_id}_                                     │    │   │
│  │  │  Query Scope: Automatic tenant filtering                        │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Tenant Limits Configuration

```yaml
# Per-tenant limits configuration
limits_config:
  # Ingestion limits
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  max_streams_per_user: 10000
  max_line_size: 256KB
  max_entries_limit_per_query: 5000
  
  # Query limits
  max_query_parallelism: 32
  max_query_length: 721h  # 30 days
  max_query_series: 500
  
  # Retention
  retention_period: 744h  # 31 days
  
  # Per-stream rate limiting
  per_stream_rate_limit: 3MB
  per_stream_rate_limit_burst: 15MB

# Override limits per tenant
overrides:
  tenant-premium:
    ingestion_rate_mb: 100
    max_streams_per_user: 100000
    retention_period: 8760h  # 1 year
  
  tenant-basic:
    ingestion_rate_mb: 5
    max_streams_per_user: 1000
    retention_period: 168h  # 7 days
```

#### Tenant-Aware Components

```go
package tenant

import (
    "context"
    "fmt"
    "sync"

    "github.com/grafana/dskit/user"
)

// TenantID extracts tenant ID from context
func TenantID(ctx context.Context) (string, error) {
    tenantID, err := user.ExtractOrgID(ctx)
    if err != nil {
        return "", fmt.Errorf("no tenant ID in context: %w", err)
    }
    return tenantID, nil
}

// Limiter enforces per-tenant resource limits
type Limiter struct {
    limits   Limits
    overrides OverridesManager
    
    // Per-tenant state
    tenantState map[string]*tenantLimitState
    mu          sync.RWMutex
}

type tenantLimitState struct {
    activeStreams   int64
    ingestionRate   *rate.Limiter
    queryRate       *rate.Limiter
}

// AssertMaxStreamsPerUser checks stream count limit
func (l *Limiter) AssertMaxStreamsPerUser(tenantID string, currentStreams int) error {
    limit := l.overrides.MaxStreamsPerUser(tenantID)
    if currentStreams >= limit {
        return fmt.Errorf("per-tenant stream limit exceeded (limit: %d, current: %d)", limit, currentStreams)
    }
    return nil
}

// AssertMaxLineSize checks line size limit
func (l *Limiter) AssertMaxLineSize(tenantID string, lineSize int) error {
    limit := l.overrides.MaxLineSize(tenantID)
    if lineSize > limit {
        return fmt.Errorf("line too long (limit: %d, size: %d)", limit, lineSize)
    }
    return nil
}

// AllowIngestion checks ingestion rate limit
func (l *Limiter) AllowIngestion(tenantID string, bytes int) bool {
    l.mu.RLock()
    state, ok := l.tenantState[tenantID]
    l.mu.RUnlock()
    
    if !ok {
        l.mu.Lock()
        state = l.createTenantState(tenantID)
        l.tenantState[tenantID] = state
        l.mu.Unlock()
    }
    
    return state.ingestionRate.AllowN(time.Now(), bytes)
}

func (l *Limiter) createTenantState(tenantID string) *tenantLimitState {
    ingestionRate := l.overrides.IngestionRateMB(tenantID) * 1024 * 1024
    burstSize := l.overrides.IngestionBurstSizeMB(tenantID) * 1024 * 1024
    
    return &tenantLimitState{
        ingestionRate: rate.NewLimiter(rate.Limit(ingestionRate), burstSize),
        queryRate:     rate.NewLimiter(rate.Limit(l.overrides.MaxQueryParallelism(tenantID)), 10),
    }
}

// TenantStorage provides tenant-isolated storage paths
type TenantStorage struct {
    bucket string
}

// ChunkPath returns the storage path for a tenant's chunk
func (s *TenantStorage) ChunkPath(tenantID, chunkID string) string {
    return fmt.Sprintf("%s/%s/chunks/%s", s.bucket, tenantID, chunkID)
}

// IndexPath returns the storage path for a tenant's index
func (s *TenantStorage) IndexPath(tenantID string, period time.Time) string {
    return fmt.Sprintf("%s/%s/index/%s", s.bucket, tenantID, period.Format("2006-01-02"))
}
```


### Scaling Strategies

Scaling Loki requires understanding component-specific strategies and the hash ring for distributed coordination.

#### Hash Ring for Distributed Coordination

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HASH RING ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CONSISTENT HASH RING                             │   │
│  │                                                                          │   │
│  │                              0°                                          │   │
│  │                              │                                           │   │
│  │                    ┌─────────┴─────────┐                                │   │
│  │                   ╱                     ╲                               │   │
│  │                  ╱    Ingester-0         ╲                              │   │
│  │                 ╱     Token: 0            ╲                             │   │
│  │                │                           │                            │   │
│  │       270° ────┤                           ├──── 90°                    │   │
│  │                │    Ingester-2             │    Ingester-1              │   │
│  │                │    Token: 180             │    Token: 90               │   │
│  │                 ╲                         ╱                             │   │
│  │                  ╲                       ╱                              │   │
│  │                   ╲                     ╱                               │   │
│  │                    └─────────┬─────────┘                                │   │
│  │                              │                                           │   │
│  │                             180°                                         │   │
│  │                                                                          │   │
│  │  Stream Assignment:                                                      │   │
│  │  hash(tenant + labels) → token → nearest ingester (clockwise)           │   │
│  │                                                                          │   │
│  │  Replication Factor = 3:                                                │   │
│  │  Stream written to 3 consecutive ingesters on ring                      │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Scaling Components

| Component | Scaling Strategy | Considerations |
|-----------|-----------------|----------------|
| **Distributor** | Horizontal, stateless | Add more replicas for higher ingestion |
| **Ingester** | Horizontal with ring | Rebalancing required, use zone-awareness |
| **Querier** | Horizontal, stateless | Scale based on query load |
| **Query Frontend** | Horizontal, stateless | Usually 2-3 replicas sufficient |
| **Compactor** | Single or sharded | Sharded for high volume |
| **Index Gateway** | Horizontal, stateless | Scale based on index query load |

#### Horizontal Scaling Implementation

```go
package ring

import (
    "context"
    "sort"
    "sync"
    "time"

    "github.com/grafana/dskit/ring"
)

// IngesterRing manages ingester distribution
type IngesterRing struct {
    ring *ring.Ring
    cfg  RingConfig
}

type RingConfig struct {
    ReplicationFactor int
    HeartbeatTimeout  time.Duration
    ZoneAwarenessEnabled bool
}

// GetIngestersForStream returns ingesters responsible for a stream
func (r *IngesterRing) GetIngestersForStream(tenantID string, labels string) ([]IngesterDesc, error) {
    // Calculate stream hash
    streamHash := tokenFor(tenantID, labels)
    
    // Get replication set from ring
    replicationSet, err := r.ring.Get(streamHash, ring.Write, nil, nil, nil)
    if err != nil {
        return nil, err
    }
    
    // Convert to ingester descriptors
    ingesters := make([]IngesterDesc, 0, len(replicationSet.Instances))
    for _, instance := range replicationSet.Instances {
        ingesters = append(ingesters, IngesterDesc{
            Addr:  instance.Addr,
            Zone:  instance.Zone,
            State: instance.State,
        })
    }
    
    return ingesters, nil
}

// tokenFor generates a consistent hash token for a stream
func tokenFor(tenantID, labels string) uint32 {
    h := fnv.New32a()
    h.Write([]byte(tenantID))
    h.Write([]byte(labels))
    return h.Sum32()
}

// Zone-Aware Replication
type ZoneAwareReplicator struct {
    ring *ring.Ring
    cfg  RingConfig
}

// ReplicateToZones ensures data is replicated across availability zones
func (r *ZoneAwareReplicator) ReplicateToZones(ctx context.Context, streamHash uint32, data []byte) error {
    // Get instances ensuring zone diversity
    instances, err := r.ring.Get(streamHash, ring.Write, nil, nil, nil)
    if err != nil {
        return err
    }
    
    // Group by zone
    byZone := make(map[string][]ring.InstanceDesc)
    for _, inst := range instances.Instances {
        byZone[inst.Zone] = append(byZone[inst.Zone], inst)
    }
    
    // Ensure we have instances in different zones
    if len(byZone) < r.cfg.ReplicationFactor && r.cfg.ZoneAwarenessEnabled {
        return fmt.Errorf("insufficient zone diversity: need %d zones, have %d", 
            r.cfg.ReplicationFactor, len(byZone))
    }
    
    // Replicate to each zone
    var wg sync.WaitGroup
    errors := make(chan error, len(instances.Instances))
    
    for _, inst := range instances.Instances {
        wg.Add(1)
        go func(instance ring.InstanceDesc) {
            defer wg.Done()
            if err := r.sendToInstance(ctx, instance, data); err != nil {
                errors <- err
            }
        }(inst)
    }
    
    wg.Wait()
    close(errors)
    
    // Check for quorum
    successCount := len(instances.Instances) - len(errors)
    quorum := (r.cfg.ReplicationFactor / 2) + 1
    if successCount < quorum {
        return fmt.Errorf("failed to achieve quorum: %d/%d succeeded", successCount, r.cfg.ReplicationFactor)
    }
    
    return nil
}

// Graceful Scaling Operations
type ScaleManager struct {
    ring     *ring.Ring
    ingester *Ingester
}

// PrepareForScaleDown initiates graceful shutdown
func (m *ScaleManager) PrepareForScaleDown(ctx context.Context) error {
    // 1. Mark instance as LEAVING in ring
    if err := m.ring.ChangeState(ctx, ring.LEAVING); err != nil {
        return err
    }
    
    // 2. Flush all chunks to storage
    if err := m.ingester.FlushAll(ctx); err != nil {
        return err
    }
    
    // 3. Transfer ownership to remaining instances
    if err := m.transferOwnership(ctx); err != nil {
        return err
    }
    
    // 4. Wait for in-flight requests to complete
    m.ingester.WaitForInflight(ctx)
    
    return nil
}

func (m *ScaleManager) transferOwnership(ctx context.Context) error {
    // Get streams owned by this instance
    streams := m.ingester.GetOwnedStreams()
    
    for _, stream := range streams {
        // Find new owner
        newOwners, err := m.ring.Get(stream.Hash, ring.Write, nil, nil, nil)
        if err != nil {
            return err
        }
        
        // Transfer stream data
        for _, owner := range newOwners.Instances {
            if owner.Addr != m.ingester.Addr() {
                if err := m.transferStream(ctx, stream, owner); err != nil {
                    return err
                }
                break
            }
        }
    }
    
    return nil
}
```

---

## Distributed Storage Optimization

Optimizing distributed storage is critical for Loki's performance and cost efficiency. This section covers write path optimization, read path optimization, compaction strategies, and performance benchmarking.

### Write Path Optimization

#### Batching and Compression

```go
package storage

import (
    "bytes"
    "context"
    "sync"
    "time"

    "github.com/klauspost/compress/zstd"
)

// BatchWriter optimizes writes to object storage
type BatchWriter struct {
    cfg     BatchConfig
    storage ObjectStorage
    
    // Batching
    pending    map[string]*pendingBatch
    pendingMtx sync.Mutex
    
    // Compression
    encoder *zstd.Encoder
    
    // Metrics
    metrics *writerMetrics
}

type BatchConfig struct {
    MaxBatchSize     int           // Max bytes per batch
    MaxBatchWait     time.Duration // Max time to wait for batch
    MaxBatchObjects  int           // Max objects per batch
    CompressionLevel int           // Compression level (1-19)
    Parallelism      int           // Concurrent uploads
}

type pendingBatch struct {
    objects   []pendingObject
    size      int
    createdAt time.Time
}

type pendingObject struct {
    key  string
    data []byte
}

// Write adds an object to the batch
func (w *BatchWriter) Write(ctx context.Context, key string, data []byte) error {
    w.pendingMtx.Lock()
    defer w.pendingMtx.Unlock()
    
    // Get or create batch for this prefix
    prefix := extractPrefix(key)
    batch, ok := w.pending[prefix]
    if !ok {
        batch = &pendingBatch{createdAt: time.Now()}
        w.pending[prefix] = batch
    }
    
    // Compress data
    compressed := w.compress(data)
    
    // Add to batch
    batch.objects = append(batch.objects, pendingObject{
        key:  key,
        data: compressed,
    })
    batch.size += len(compressed)
    
    // Check if batch should be flushed
    if w.shouldFlush(batch) {
        return w.flushBatch(ctx, prefix, batch)
    }
    
    return nil
}

func (w *BatchWriter) shouldFlush(batch *pendingBatch) bool {
    if batch.size >= w.cfg.MaxBatchSize {
        return true
    }
    if len(batch.objects) >= w.cfg.MaxBatchObjects {
        return true
    }
    if time.Since(batch.createdAt) >= w.cfg.MaxBatchWait {
        return true
    }
    return false
}

func (w *BatchWriter) flushBatch(ctx context.Context, prefix string, batch *pendingBatch) error {
    // Upload objects in parallel
    sem := make(chan struct{}, w.cfg.Parallelism)
    var wg sync.WaitGroup
    errors := make(chan error, len(batch.objects))
    
    for _, obj := range batch.objects {
        wg.Add(1)
        go func(o pendingObject) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            if err := w.storage.Put(ctx, o.key, o.data); err != nil {
                errors <- err
            }
        }(obj)
    }
    
    wg.Wait()
    close(errors)
    
    // Clear batch
    delete(w.pending, prefix)
    
    // Return first error if any
    for err := range errors {
        return err
    }
    
    return nil
}

func (w *BatchWriter) compress(data []byte) []byte {
    return w.encoder.EncodeAll(data, nil)
}

// Periodic flusher for time-based batching
func (w *BatchWriter) StartPeriodicFlush(ctx context.Context) {
    ticker := time.NewTicker(w.cfg.MaxBatchWait / 2)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            w.flushExpiredBatches(ctx)
        }
    }
}

func (w *BatchWriter) flushExpiredBatches(ctx context.Context) {
    w.pendingMtx.Lock()
    defer w.pendingMtx.Unlock()
    
    for prefix, batch := range w.pending {
        if time.Since(batch.createdAt) >= w.cfg.MaxBatchWait {
            w.flushBatch(ctx, prefix, batch)
        }
    }
}
```

### Read Path Optimization

#### Chunk Caching

```go
package cache

import (
    "container/list"
    "sync"
    "time"
)

// ChunkCache provides LRU caching for frequently accessed chunks
type ChunkCache struct {
    cfg      CacheConfig
    
    // LRU cache
    items    map[string]*cacheItem
    lru      *list.List
    mu       sync.RWMutex
    
    // Stats
    hits     int64
    misses   int64
    evictions int64
}

type CacheConfig struct {
    MaxSize      int64         // Max cache size in bytes
    MaxItems     int           // Max number of items
    TTL          time.Duration // Item TTL
    ShardCount   int           // Number of shards for concurrency
}

type cacheItem struct {
    key       string
    value     []byte
    size      int64
    expiresAt time.Time
    element   *list.Element
}

// Get retrieves a chunk from cache
func (c *ChunkCache) Get(key string) ([]byte, bool) {
    c.mu.RLock()
    item, ok := c.items[key]
    c.mu.RUnlock()
    
    if !ok {
        atomic.AddInt64(&c.misses, 1)
        return nil, false
    }
    
    // Check expiration
    if time.Now().After(item.expiresAt) {
        c.mu.Lock()
        c.removeItem(item)
        c.mu.Unlock()
        atomic.AddInt64(&c.misses, 1)
        return nil, false
    }
    
    // Move to front (most recently used)
    c.mu.Lock()
    c.lru.MoveToFront(item.element)
    c.mu.Unlock()
    
    atomic.AddInt64(&c.hits, 1)
    return item.value, true
}

// Put adds a chunk to cache
func (c *ChunkCache) Put(key string, value []byte) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    // Check if already exists
    if existing, ok := c.items[key]; ok {
        c.removeItem(existing)
    }
    
    // Evict if necessary
    size := int64(len(value))
    for c.currentSize()+size > c.cfg.MaxSize || len(c.items) >= c.cfg.MaxItems {
        c.evictOldest()
    }
    
    // Add new item
    item := &cacheItem{
        key:       key,
        value:     value,
        size:      size,
        expiresAt: time.Now().Add(c.cfg.TTL),
    }
    item.element = c.lru.PushFront(item)
    c.items[key] = item
}

func (c *ChunkCache) evictOldest() {
    if c.lru.Len() == 0 {
        return
    }
    
    oldest := c.lru.Back()
    if oldest != nil {
        item := oldest.Value.(*cacheItem)
        c.removeItem(item)
        atomic.AddInt64(&c.evictions, 1)
    }
}

func (c *ChunkCache) removeItem(item *cacheItem) {
    c.lru.Remove(item.element)
    delete(c.items, item.key)
}

// Prefetcher anticipates chunk access patterns
type ChunkPrefetcher struct {
    cache   *ChunkCache
    storage ObjectStorage
    
    // Prefetch queue
    queue   chan string
    workers int
}

// PrefetchRelated prefetches chunks likely to be accessed next
func (p *ChunkPrefetcher) PrefetchRelated(ctx context.Context, chunkKey string) {
    // Predict related chunks based on access patterns
    relatedKeys := p.predictRelatedChunks(chunkKey)
    
    for _, key := range relatedKeys {
        // Check if already cached
        if _, ok := p.cache.Get(key); ok {
            continue
        }
        
        // Queue for prefetch
        select {
        case p.queue <- key:
        default:
            // Queue full, skip
        }
    }
}

func (p *ChunkPrefetcher) predictRelatedChunks(key string) []string {
    // Prediction strategies:
    // 1. Temporal locality: chunks from adjacent time ranges
    // 2. Spatial locality: chunks from same stream
    // 3. Access pattern: chunks frequently accessed together
    
    var related []string
    
    // Parse chunk key to extract stream and time info
    stream, timestamp := parseChunkKey(key)
    
    // Add adjacent time chunks
    for i := 1; i <= 3; i++ {
        nextTime := timestamp.Add(time.Duration(i) * time.Hour)
        related = append(related, buildChunkKey(stream, nextTime))
    }
    
    return related
}

func (p *ChunkPrefetcher) startWorkers(ctx context.Context) {
    for i := 0; i < p.workers; i++ {
        go func() {
            for {
                select {
                case <-ctx.Done():
                    return
                case key := <-p.queue:
                    data, err := p.storage.Get(ctx, key)
                    if err == nil {
                        p.cache.Put(key, data)
                    }
                }
            }
        }()
    }
}
```


### Compaction Strategies

Compaction optimizes storage by merging small chunks and removing deleted data.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPACTION PROCESS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Before Compaction:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Day 1: 1000 small index files, 5000 small chunks                       │   │
│  │  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐ ...               │   │
│  │  │ 1 ││ 2 ││ 3 ││ 4 ││ 5 ││ 6 ││ 7 ││ 8 ││ 9 ││10 │                   │   │
│  │  └───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  After Compaction:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Day 1: 1 compacted index file, 50 optimized chunks                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Compacted Index + Chunks                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Benefits:                                                                       │
│  • Reduced object count (lower API costs)                                       │
│  • Faster queries (fewer files to scan)                                         │
│  • Better compression (larger blocks)                                           │
│  • Retention enforcement (delete expired data)                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Compactor Implementation

```go
package compactor

import (
    "context"
    "sort"
    "sync"
    "time"
)

// Compactor manages chunk and index compaction
type Compactor struct {
    cfg     CompactorConfig
    storage ObjectStorage
    
    // Compaction state
    tables   map[string]*tableCompactor
    tablesMu sync.RWMutex
}

type CompactorConfig struct {
    // Compaction triggers
    CompactionInterval    time.Duration
    RetentionEnabled      bool
    RetentionPeriod       time.Duration
    
    // Compaction settings
    MaxCompactionParallelism int
    TargetChunkSize          int64
    
    // Sharding for distributed compaction
    ShardingEnabled bool
    TotalShards     int
    OwnedShards     []int
}

// CompactTable compacts a single table (day's worth of data)
func (c *Compactor) CompactTable(ctx context.Context, tableName string) error {
    // 1. List all index files for the table
    indexFiles, err := c.storage.List(ctx, tableName+"/index/")
    if err != nil {
        return err
    }
    
    // 2. Download and merge index files
    mergedIndex, err := c.mergeIndexFiles(ctx, indexFiles)
    if err != nil {
        return err
    }
    
    // 3. Apply retention (remove expired entries)
    if c.cfg.RetentionEnabled {
        mergedIndex = c.applyRetention(mergedIndex)
    }
    
    // 4. Identify chunks to compact
    chunksToCompact := c.identifyCompactionCandidates(mergedIndex)
    
    // 5. Compact chunks
    for _, group := range chunksToCompact {
        if err := c.compactChunkGroup(ctx, group); err != nil {
            return err
        }
    }
    
    // 6. Write compacted index
    if err := c.writeCompactedIndex(ctx, tableName, mergedIndex); err != nil {
        return err
    }
    
    // 7. Delete old files
    return c.deleteOldFiles(ctx, indexFiles)
}

// mergeIndexFiles combines multiple index files into one
func (c *Compactor) mergeIndexFiles(ctx context.Context, files []string) (*Index, error) {
    merged := NewIndex()
    
    for _, file := range files {
        data, err := c.storage.Get(ctx, file)
        if err != nil {
            return nil, err
        }
        
        index, err := ParseIndex(data)
        if err != nil {
            return nil, err
        }
        
        merged.Merge(index)
    }
    
    return merged, nil
}

// applyRetention removes entries older than retention period
func (c *Compactor) applyRetention(index *Index) *Index {
    cutoff := time.Now().Add(-c.cfg.RetentionPeriod)
    
    filtered := NewIndex()
    for _, entry := range index.Entries() {
        if entry.Through.After(cutoff) {
            filtered.Add(entry)
        }
    }
    
    return filtered
}

// identifyCompactionCandidates groups small chunks for compaction
func (c *Compactor) identifyCompactionCandidates(index *Index) []ChunkGroup {
    // Group chunks by stream
    byStream := make(map[string][]*ChunkRef)
    for _, ref := range index.ChunkRefs() {
        key := ref.StreamKey()
        byStream[key] = append(byStream[key], ref)
    }
    
    var groups []ChunkGroup
    
    for streamKey, chunks := range byStream {
        // Sort by time
        sort.Slice(chunks, func(i, j int) bool {
            return chunks[i].From.Before(chunks[j].From)
        })
        
        // Group adjacent small chunks
        var currentGroup ChunkGroup
        currentGroup.StreamKey = streamKey
        
        for _, chunk := range chunks {
            if currentGroup.TotalSize+chunk.Size > c.cfg.TargetChunkSize {
                if len(currentGroup.Chunks) > 1 {
                    groups = append(groups, currentGroup)
                }
                currentGroup = ChunkGroup{StreamKey: streamKey}
            }
            currentGroup.Chunks = append(currentGroup.Chunks, chunk)
            currentGroup.TotalSize += chunk.Size
        }
        
        if len(currentGroup.Chunks) > 1 {
            groups = append(groups, currentGroup)
        }
    }
    
    return groups
}

// compactChunkGroup merges multiple chunks into one
func (c *Compactor) compactChunkGroup(ctx context.Context, group ChunkGroup) error {
    // Download all chunks
    var entries []LogEntry
    for _, ref := range group.Chunks {
        data, err := c.storage.Get(ctx, ref.Path)
        if err != nil {
            return err
        }
        
        chunk, err := ParseChunk(data)
        if err != nil {
            return err
        }
        
        entries = append(entries, chunk.Entries()...)
    }
    
    // Sort entries by timestamp
    sort.Slice(entries, func(i, j int) bool {
        return entries[i].Timestamp.Before(entries[j].Timestamp)
    })
    
    // Create new compacted chunk
    compacted := NewChunk(EncZstd)
    for _, entry := range entries {
        compacted.Append(entry.Timestamp, entry.Line)
    }
    
    // Upload compacted chunk
    data, err := compacted.Bytes()
    if err != nil {
        return err
    }
    
    newPath := generateChunkPath(group.StreamKey, compacted.From(), compacted.Through())
    if err := c.storage.Put(ctx, newPath, data); err != nil {
        return err
    }
    
    // Delete old chunks
    for _, ref := range group.Chunks {
        if err := c.storage.Delete(ctx, ref.Path); err != nil {
            // Log but don't fail - orphaned chunks will be cleaned up later
            log.Printf("Failed to delete old chunk %s: %v", ref.Path, err)
        }
    }
    
    return nil
}
```

### Retention and Lifecycle Management

```yaml
# Loki retention configuration
compactor:
  working_directory: /data/compactor
  shared_store: s3
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150

limits_config:
  retention_period: 744h  # 31 days default

# Per-tenant retention overrides
overrides:
  tenant-compliance:
    retention_period: 8760h  # 1 year for compliance
  tenant-dev:
    retention_period: 168h   # 7 days for dev

# S3 lifecycle rules for additional cost optimization
# lifecycle_rules:
#   - transition to Glacier after 90 days
#   - delete after 365 days
```

### Performance Benchmarking

```go
package benchmark

import (
    "context"
    "fmt"
    "sync"
    "sync/atomic"
    "time"
)

// StorageBenchmark measures storage performance
type StorageBenchmark struct {
    storage ObjectStorage
    results *BenchmarkResults
}

type BenchmarkResults struct {
    WriteLatencyP50  time.Duration
    WriteLatencyP99  time.Duration
    WriteThroughput  float64 // MB/s
    
    ReadLatencyP50   time.Duration
    ReadLatencyP99   time.Duration
    ReadThroughput   float64 // MB/s
    
    ListLatency      time.Duration
    DeleteLatency    time.Duration
}

// RunWriteBenchmark measures write performance
func (b *StorageBenchmark) RunWriteBenchmark(ctx context.Context, cfg BenchmarkConfig) error {
    var latencies []time.Duration
    var totalBytes int64
    var mu sync.Mutex
    
    start := time.Now()
    
    // Generate test data
    data := make([]byte, cfg.ObjectSize)
    for i := range data {
        data[i] = byte(i % 256)
    }
    
    // Run concurrent writes
    var wg sync.WaitGroup
    sem := make(chan struct{}, cfg.Concurrency)
    
    for i := 0; i < cfg.NumObjects; i++ {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            key := fmt.Sprintf("benchmark/write/%d", idx)
            
            writeStart := time.Now()
            err := b.storage.Put(ctx, key, data)
            writeLatency := time.Since(writeStart)
            
            if err != nil {
                return
            }
            
            mu.Lock()
            latencies = append(latencies, writeLatency)
            mu.Unlock()
            
            atomic.AddInt64(&totalBytes, int64(len(data)))
        }(i)
    }
    
    wg.Wait()
    elapsed := time.Since(start)
    
    // Calculate results
    sort.Slice(latencies, func(i, j int) bool {
        return latencies[i] < latencies[j]
    })
    
    b.results.WriteLatencyP50 = latencies[len(latencies)/2]
    b.results.WriteLatencyP99 = latencies[int(float64(len(latencies))*0.99)]
    b.results.WriteThroughput = float64(totalBytes) / elapsed.Seconds() / 1024 / 1024
    
    return nil
}

// RunReadBenchmark measures read performance
func (b *StorageBenchmark) RunReadBenchmark(ctx context.Context, cfg BenchmarkConfig) error {
    // Similar implementation for reads
    // ...
    return nil
}

// PrintResults outputs benchmark results
func (b *StorageBenchmark) PrintResults() {
    fmt.Printf("Storage Benchmark Results:\n")
    fmt.Printf("==========================\n")
    fmt.Printf("Write Performance:\n")
    fmt.Printf("  P50 Latency: %v\n", b.results.WriteLatencyP50)
    fmt.Printf("  P99 Latency: %v\n", b.results.WriteLatencyP99)
    fmt.Printf("  Throughput:  %.2f MB/s\n", b.results.WriteThroughput)
    fmt.Printf("\nRead Performance:\n")
    fmt.Printf("  P50 Latency: %v\n", b.results.ReadLatencyP50)
    fmt.Printf("  P99 Latency: %v\n", b.results.ReadLatencyP99)
    fmt.Printf("  Throughput:  %.2f MB/s\n", b.results.ReadThroughput)
}
```

---

## SRE Practices and On-Call

Site Reliability Engineering practices are essential for operating distributed systems at scale. This section covers on-call and incident response, SLOs/SLIs/error budgets, capacity planning, chaos engineering, and post-mortem culture.

> **Related Resource**: For observability principles, see [Observability Principles](../../shared-concepts/observability-principles.md)

### On-Call and Incident Response

#### Incident Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **SEV1** | Critical, customer-facing outage | 15 minutes | Complete service unavailable |
| **SEV2** | Major degradation | 30 minutes | Significant latency increase, partial outage |
| **SEV3** | Minor impact | 4 hours | Non-critical feature broken |
| **SEV4** | Minimal impact | Next business day | Cosmetic issues, minor bugs |

#### Incident Response Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INCIDENT RESPONSE WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. DETECTION                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Automated alerting (PagerDuty, Opsgenie)                             │   │
│  │  • Customer reports                                                      │   │
│  │  • Internal monitoring                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  2. TRIAGE                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Assess severity and impact                                           │   │
│  │  • Identify affected systems/customers                                   │   │
│  │  • Assign incident commander                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  3. MITIGATION                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Implement immediate fixes (rollback, scale, failover)                │   │
│  │  • Communicate status to stakeholders                                   │   │
│  │  • Document actions taken                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  4. RESOLUTION                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Verify service restored                                              │   │
│  │  • Monitor for recurrence                                               │   │
│  │  • Close incident                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  5. POST-MORTEM                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Blameless analysis                                                   │   │
│  │  • Identify root cause                                                  │   │
│  │  • Define action items                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Runbook Example

```markdown
# Runbook: Loki Ingester High Memory Usage

## Alert
`LokiIngesterMemoryHigh` - Ingester memory usage > 80%

## Impact
- Potential OOM kills leading to data loss
- Increased latency for log ingestion
- Risk of cascading failures

## Investigation Steps

### 1. Check Current State
```bash
# Check memory usage across ingesters
kubectl top pods -l app=loki,component=ingester -n monitoring

# Check ingester metrics
curl -s http://loki-ingester:3100/metrics | grep -E "go_memstats|loki_ingester"
```

### 2. Identify Cause
```bash
# Check active streams per tenant
curl -s http://loki-ingester:3100/ingester/ring | jq '.shards[].num_tokens'

# Check for cardinality explosion
curl -s "http://loki-query-frontend:3100/loki/api/v1/series?match[]={}" | jq '.data | length'

# Check flush queue depth
curl -s http://loki-ingester:3100/metrics | grep loki_ingester_flush_queue
```

### 3. Mitigation Options

#### Option A: Scale Out (Preferred)
```bash
kubectl scale statefulset loki-ingester --replicas=5 -n monitoring
```

#### Option B: Force Flush
```bash
# Trigger manual flush
curl -X POST http://loki-ingester:3100/flush
```

#### Option C: Reduce Cardinality
```bash
# Identify high-cardinality tenants
curl -s http://loki-ingester:3100/metrics | grep loki_ingester_streams_created_total

# Apply rate limiting for problematic tenant
kubectl patch configmap loki-runtime-config -n monitoring --patch '
data:
  overrides.yaml: |
    overrides:
      problematic-tenant:
        max_streams_per_user: 1000
'
```

## Escalation
- If memory continues to grow after mitigation: Page secondary on-call
- If data loss suspected: Notify incident commander
```


### SLOs, SLIs, and Error Budgets

#### Defining SLIs for Loki

| SLI | Definition | Measurement |
|-----|------------|-------------|
| **Availability** | % of successful requests | `sum(rate(http_requests_total{status!~"5.."})) / sum(rate(http_requests_total))` |
| **Ingestion Latency** | P99 latency for push requests | `histogram_quantile(0.99, rate(loki_request_duration_seconds_bucket{route="/loki/api/v1/push"}[5m]))` |
| **Query Latency** | P99 latency for queries | `histogram_quantile(0.99, rate(loki_request_duration_seconds_bucket{route=~"/loki/api/v1/query.*"}[5m]))` |
| **Data Freshness** | Time from log generation to queryable | Custom instrumentation |

#### SLO Configuration

```yaml
# SLO definitions for Loki
slos:
  - name: loki-availability
    description: "Loki API availability"
    sli:
      events:
        error_query: |
          sum(rate(loki_request_duration_seconds_count{status_code=~"5.."}[{{.window}}]))
        total_query: |
          sum(rate(loki_request_duration_seconds_count[{{.window}}]))
    objectives:
      - target: 0.999  # 99.9%
        window: 30d
    alerting:
      page_alert:
        labels:
          severity: critical
      ticket_alert:
        labels:
          severity: warning

  - name: loki-ingestion-latency
    description: "Loki ingestion P99 latency"
    sli:
      events:
        error_query: |
          sum(rate(loki_request_duration_seconds_bucket{route="/loki/api/v1/push",le="1"}[{{.window}}]))
        total_query: |
          sum(rate(loki_request_duration_seconds_count{route="/loki/api/v1/push"}[{{.window}}]))
    objectives:
      - target: 0.99  # 99% of requests under 1s
        window: 30d

  - name: loki-query-latency
    description: "Loki query P99 latency"
    sli:
      events:
        error_query: |
          sum(rate(loki_request_duration_seconds_bucket{route=~"/loki/api/v1/query.*",le="30"}[{{.window}}]))
        total_query: |
          sum(rate(loki_request_duration_seconds_count{route=~"/loki/api/v1/query.*"}[{{.window}}]))
    objectives:
      - target: 0.95  # 95% of queries under 30s
        window: 30d
```

#### Error Budget Calculation

```go
package slo

import (
    "context"
    "time"
)

// ErrorBudget tracks SLO compliance and remaining budget
type ErrorBudget struct {
    SLOTarget     float64       // e.g., 0.999 for 99.9%
    Window        time.Duration // e.g., 30 days
    
    // Current state
    TotalRequests int64
    FailedRequests int64
}

// RemainingBudget calculates remaining error budget
func (eb *ErrorBudget) RemainingBudget() float64 {
    if eb.TotalRequests == 0 {
        return 1.0
    }
    
    // Allowed failures = total * (1 - target)
    allowedFailures := float64(eb.TotalRequests) * (1 - eb.SLOTarget)
    
    // Remaining = allowed - actual
    remaining := allowedFailures - float64(eb.FailedRequests)
    
    // Return as percentage of allowed
    if allowedFailures == 0 {
        return 0
    }
    return remaining / allowedFailures
}

// BurnRate calculates how fast the error budget is being consumed
func (eb *ErrorBudget) BurnRate(windowDuration time.Duration) float64 {
    if eb.TotalRequests == 0 {
        return 0
    }
    
    // Current error rate
    errorRate := float64(eb.FailedRequests) / float64(eb.TotalRequests)
    
    // Allowed error rate
    allowedErrorRate := 1 - eb.SLOTarget
    
    // Burn rate = actual / allowed
    if allowedErrorRate == 0 {
        return 0
    }
    return errorRate / allowedErrorRate
}

// TimeToExhaustion estimates when budget will be exhausted at current burn rate
func (eb *ErrorBudget) TimeToExhaustion() time.Duration {
    burnRate := eb.BurnRate(eb.Window)
    if burnRate <= 1 {
        return time.Duration(0) // Not burning budget
    }
    
    remaining := eb.RemainingBudget()
    if remaining <= 0 {
        return time.Duration(0) // Already exhausted
    }
    
    // Time = remaining_budget / (burn_rate - 1) * window
    exhaustionFraction := remaining / (burnRate - 1)
    return time.Duration(float64(eb.Window) * exhaustionFraction)
}

// Multi-Window Burn Rate Alerting
type BurnRateAlert struct {
    // Fast burn: 14.4x burn rate over 1 hour (2% budget in 1 hour)
    FastBurnRate     float64
    FastBurnWindow   time.Duration
    
    // Slow burn: 6x burn rate over 6 hours (5% budget in 6 hours)
    SlowBurnRate     float64
    SlowBurnWindow   time.Duration
}

func (a *BurnRateAlert) ShouldAlert(eb *ErrorBudget) bool {
    // Check fast burn
    fastBurn := eb.BurnRate(a.FastBurnWindow)
    if fastBurn >= a.FastBurnRate {
        return true
    }
    
    // Check slow burn
    slowBurn := eb.BurnRate(a.SlowBurnWindow)
    if slowBurn >= a.SlowBurnRate {
        return true
    }
    
    return false
}
```

#### Prometheus Alerting Rules for SLOs

```yaml
groups:
  - name: loki-slo-alerts
    rules:
      # Fast burn alert (2% budget in 1 hour)
      - alert: LokiHighErrorBudgetBurn
        expr: |
          (
            sum(rate(loki_request_duration_seconds_count{status_code=~"5.."}[1h]))
            /
            sum(rate(loki_request_duration_seconds_count[1h]))
          ) > (14.4 * (1 - 0.999))
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Loki is burning error budget too fast"
          description: "Current burn rate will exhaust monthly error budget in {{ $value | humanizeDuration }}"
      
      # Slow burn alert (5% budget in 6 hours)
      - alert: LokiElevatedErrorRate
        expr: |
          (
            sum(rate(loki_request_duration_seconds_count{status_code=~"5.."}[6h]))
            /
            sum(rate(loki_request_duration_seconds_count[6h]))
          ) > (6 * (1 - 0.999))
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Loki error rate elevated"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 6 hours"
      
      # Error budget exhaustion warning
      - alert: LokiErrorBudgetLow
        expr: |
          1 - (
            sum(increase(loki_request_duration_seconds_count{status_code=~"5.."}[30d]))
            /
            sum(increase(loki_request_duration_seconds_count[30d]))
          ) / 0.999 < 0.25
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Loki error budget running low"
          description: "Only {{ $value | humanizePercentage }} of monthly error budget remaining"
```

### Capacity Planning

#### Capacity Model

```go
package capacity

import (
    "math"
    "time"
)

// CapacityModel estimates resource requirements
type CapacityModel struct {
    // Current metrics
    CurrentIngestionRate float64 // GB/day
    CurrentQueryRate     float64 // queries/second
    CurrentStorageSize   float64 // TB
    
    // Growth projections
    IngestionGrowthRate float64 // % per month
    QueryGrowthRate     float64 // % per month
    
    // Resource ratios (from benchmarks)
    IngesterMemoryPerGBDay float64 // GB RAM per GB/day ingestion
    IngesterCPUPerGBDay    float64 // CPU cores per GB/day ingestion
    QuerierMemoryPerQPS    float64 // GB RAM per query/second
    QuerierCPUPerQPS       float64 // CPU cores per query/second
    StorageCostPerTB       float64 // $ per TB per month
}

// ProjectedCapacity calculates future resource needs
func (m *CapacityModel) ProjectedCapacity(months int) *CapacityProjection {
    // Calculate growth multiplier
    ingestionMultiplier := math.Pow(1+m.IngestionGrowthRate/100, float64(months))
    queryMultiplier := math.Pow(1+m.QueryGrowthRate/100, float64(months))
    
    projectedIngestion := m.CurrentIngestionRate * ingestionMultiplier
    projectedQueries := m.CurrentQueryRate * queryMultiplier
    
    // Calculate storage (cumulative with retention)
    retentionDays := 30.0
    projectedStorage := projectedIngestion * retentionDays / 1024 // TB
    
    return &CapacityProjection{
        Months:          months,
        IngestionRate:   projectedIngestion,
        QueryRate:       projectedQueries,
        StorageSize:     projectedStorage,
        
        // Resource requirements
        IngesterMemory:  projectedIngestion * m.IngesterMemoryPerGBDay,
        IngesterCPU:     projectedIngestion * m.IngesterCPUPerGBDay,
        QuerierMemory:   projectedQueries * m.QuerierMemoryPerQPS,
        QuerierCPU:      projectedQueries * m.QuerierCPUPerQPS,
        
        // Cost estimate
        StorageCost:     projectedStorage * m.StorageCostPerTB,
    }
}

type CapacityProjection struct {
    Months        int
    IngestionRate float64
    QueryRate     float64
    StorageSize   float64
    
    IngesterMemory float64
    IngesterCPU    float64
    QuerierMemory  float64
    QuerierCPU     float64
    
    StorageCost float64
}

// RecommendedReplicas calculates pod counts
func (p *CapacityProjection) RecommendedReplicas(podMemory, podCPU float64) map[string]int {
    return map[string]int{
        "ingesters": int(math.Ceil(math.Max(
            p.IngesterMemory/podMemory,
            p.IngesterCPU/podCPU,
        ))),
        "queriers": int(math.Ceil(math.Max(
            p.QuerierMemory/podMemory,
            p.QuerierCPU/podCPU,
        ))),
    }
}
```

#### Capacity Planning Dashboard Queries

```promql
# Current ingestion rate (GB/day)
sum(rate(loki_distributor_bytes_received_total[24h])) * 86400 / 1e9

# Current query rate
sum(rate(loki_request_duration_seconds_count{route=~"/loki/api/v1/query.*"}[5m]))

# Storage growth rate
delta(loki_store_chunks_stored_total[7d]) / 7

# Ingester memory efficiency
sum(loki_ingester_memory_chunks) / sum(container_memory_usage_bytes{container="ingester"})

# Query latency by percentile
histogram_quantile(0.99, sum(rate(loki_request_duration_seconds_bucket{route=~"/loki/api/v1/query.*"}[5m])) by (le))
```

### Chaos Engineering

#### Chaos Experiments for Loki

```yaml
# Chaos Mesh experiment: Ingester pod failure
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: loki-ingester-failure
  namespace: monitoring
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - monitoring
    labelSelectors:
      app: loki
      component: ingester
  scheduler:
    cron: "@every 2h"

---
# Network partition between ingesters
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: loki-ingester-partition
  namespace: monitoring
spec:
  action: partition
  mode: all
  selector:
    namespaces:
      - monitoring
    labelSelectors:
      app: loki
      component: ingester
  direction: both
  target:
    selector:
      namespaces:
        - monitoring
      labelSelectors:
        app: loki
        component: ingester
    mode: all
  duration: "5m"

---
# Slow storage responses
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: loki-storage-latency
  namespace: monitoring
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - monitoring
    labelSelectors:
      app: loki
  delay:
    latency: "500ms"
    correlation: "100"
    jitter: "100ms"
  direction: to
  externalTargets:
    - "s3.amazonaws.com"
  duration: "10m"
```

#### Chaos Testing Framework

```go
package chaos

import (
    "context"
    "fmt"
    "time"
)

// ChaosExperiment defines a chaos test
type ChaosExperiment struct {
    Name        string
    Description string
    Hypothesis  string
    
    // Experiment configuration
    Setup    func(ctx context.Context) error
    Inject   func(ctx context.Context) error
    Verify   func(ctx context.Context) (bool, error)
    Cleanup  func(ctx context.Context) error
    
    Duration time.Duration
}

// ChaosRunner executes chaos experiments
type ChaosRunner struct {
    experiments []*ChaosExperiment
    metrics     MetricsCollector
}

// RunExperiment executes a single chaos experiment
func (r *ChaosRunner) RunExperiment(ctx context.Context, exp *ChaosExperiment) (*ExperimentResult, error) {
    result := &ExperimentResult{
        Name:      exp.Name,
        StartTime: time.Now(),
    }
    
    // 1. Setup baseline metrics
    baselineMetrics, err := r.metrics.CollectBaseline(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to collect baseline: %w", err)
    }
    result.BaselineMetrics = baselineMetrics
    
    // 2. Run setup
    if exp.Setup != nil {
        if err := exp.Setup(ctx); err != nil {
            return nil, fmt.Errorf("setup failed: %w", err)
        }
    }
    
    // 3. Inject chaos
    if err := exp.Inject(ctx); err != nil {
        return nil, fmt.Errorf("chaos injection failed: %w", err)
    }
    result.InjectionTime = time.Now()
    
    // 4. Wait for duration
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    case <-time.After(exp.Duration):
    }
    
    // 5. Collect experiment metrics
    experimentMetrics, err := r.metrics.CollectDuring(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to collect experiment metrics: %w", err)
    }
    result.ExperimentMetrics = experimentMetrics
    
    // 6. Verify hypothesis
    passed, err := exp.Verify(ctx)
    if err != nil {
        return nil, fmt.Errorf("verification failed: %w", err)
    }
    result.HypothesisPassed = passed
    
    // 7. Cleanup
    if exp.Cleanup != nil {
        if err := exp.Cleanup(ctx); err != nil {
            return nil, fmt.Errorf("cleanup failed: %w", err)
        }
    }
    
    // 8. Collect recovery metrics
    recoveryMetrics, err := r.metrics.CollectRecovery(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to collect recovery metrics: %w", err)
    }
    result.RecoveryMetrics = recoveryMetrics
    result.EndTime = time.Now()
    
    return result, nil
}

// Example: Ingester failure experiment
func IngesterFailureExperiment() *ChaosExperiment {
    return &ChaosExperiment{
        Name:        "ingester-failure",
        Description: "Kill one ingester pod and verify system continues operating",
        Hypothesis:  "With replication factor 3, losing one ingester should not cause data loss or significant latency increase",
        Duration:    5 * time.Minute,
        
        Inject: func(ctx context.Context) error {
            // Kill one ingester pod
            return killPod(ctx, "monitoring", "app=loki,component=ingester")
        },
        
        Verify: func(ctx context.Context) (bool, error) {
            // Check that:
            // 1. No 5xx errors during experiment
            errorRate, err := getErrorRate(ctx, "5m")
            if err != nil {
                return false, err
            }
            if errorRate > 0.001 { // 0.1% error rate threshold
                return false, nil
            }
            
            // 2. Latency didn't increase significantly
            p99Latency, err := getP99Latency(ctx, "5m")
            if err != nil {
                return false, err
            }
            if p99Latency > 2*time.Second { // 2s threshold
                return false, nil
            }
            
            // 3. Ingester recovered
            ingesterCount, err := getHealthyIngesterCount(ctx)
            if err != nil {
                return false, err
            }
            if ingesterCount < 3 {
                return false, nil
            }
            
            return true, nil
        },
        
        Cleanup: func(ctx context.Context) error {
            // Ensure ingester is back
            return waitForPodReady(ctx, "monitoring", "app=loki,component=ingester", 3)
        },
    }
}
```

### Post-Mortem Culture

#### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV1/SEV2/SEV3
**Author:** [Name]
**Status:** Draft/Final

## Executive Summary
Brief 2-3 sentence summary of what happened and impact.

## Impact
- **Users Affected:** X% of users / Y tenants
- **Duration:** HH:MM to HH:MM (X hours)
- **Data Loss:** Yes/No (details if yes)
- **Revenue Impact:** $X (if applicable)

## Timeline (All times in UTC)

| Time | Event |
|------|-------|
| HH:MM | First alert fired |
| HH:MM | On-call acknowledged |
| HH:MM | Incident declared |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |
| HH:MM | Incident closed |

## Root Cause Analysis

### What Happened
Detailed technical explanation of the failure.

### Why It Happened
Analysis of contributing factors:
1. **Technical:** [Description]
2. **Process:** [Description]
3. **Human:** [Description]

### 5 Whys Analysis
1. Why did X happen? Because Y.
2. Why did Y happen? Because Z.
3. ...

## What Went Well
- Quick detection (alert fired within X minutes)
- Effective communication during incident
- Runbook was accurate and helpful

## What Went Poorly
- Initial triage took too long
- Missing monitoring for X
- Runbook didn't cover this scenario

## Action Items

| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| P0 | Fix immediate vulnerability | @engineer | YYYY-MM-DD | Done |
| P1 | Add monitoring for X | @sre | YYYY-MM-DD | In Progress |
| P2 | Update runbook | @oncall | YYYY-MM-DD | Not Started |
| P2 | Chaos test for scenario | @team | YYYY-MM-DD | Not Started |

## Lessons Learned
Key takeaways that should be shared with the broader organization.

## Appendix
- Links to relevant dashboards
- Alert definitions
- Related incidents
```


---

## Infrastructure as Code

Infrastructure as Code (IaC) is essential for managing cloud resources consistently and reproducibly. This section covers Terraform patterns, GitOps workflows, configuration management, secret management, and environment promotion strategies.

> **Related Resource**: For Kubernetes fundamentals, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Terraform Patterns

#### Module Structure for Loki Deployment

```
terraform/
├── modules/
│   ├── loki-cluster/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── object-storage/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   └── ...
│   └── prod/
│       └── ...
└── shared/
    └── backend.tf
```

#### Loki Cluster Module

```hcl
# modules/loki-cluster/main.tf

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

# Variables
variable "cluster_name" {
  description = "Name of the Loki cluster"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for Loki"
  type        = string
  default     = "monitoring"
}

variable "storage_bucket" {
  description = "Object storage bucket for chunks and index"
  type        = string
}

variable "replicas" {
  description = "Replica counts for each component"
  type = object({
    ingester    = number
    distributor = number
    querier     = number
    compactor   = number
  })
  default = {
    ingester    = 3
    distributor = 2
    querier     = 2
    compactor   = 1
  }
}

variable "resources" {
  description = "Resource requests and limits"
  type = object({
    ingester = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
    querier = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
  })
}

variable "retention_period" {
  description = "Log retention period"
  type        = string
  default     = "744h" # 31 days
}

# Namespace
resource "kubernetes_namespace" "loki" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name"       = "loki"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}

# Loki configuration ConfigMap
resource "kubernetes_config_map" "loki_config" {
  metadata {
    name      = "${var.cluster_name}-config"
    namespace = kubernetes_namespace.loki.metadata[0].name
  }

  data = {
    "config.yaml" = templatefile("${path.module}/templates/loki-config.yaml.tpl", {
      cluster_name     = var.cluster_name
      storage_bucket   = var.storage_bucket
      retention_period = var.retention_period
      replicas         = var.replicas
    })
  }
}

# Helm release for Loki
resource "helm_release" "loki" {
  name       = var.cluster_name
  namespace  = kubernetes_namespace.loki.metadata[0].name
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki"
  version    = "5.36.0"

  values = [
    templatefile("${path.module}/templates/values.yaml.tpl", {
      cluster_name   = var.cluster_name
      storage_bucket = var.storage_bucket
      replicas       = var.replicas
      resources      = var.resources
    })
  ]

  set {
    name  = "loki.storage.bucketNames.chunks"
    value = var.storage_bucket
  }

  set {
    name  = "loki.storage.bucketNames.ruler"
    value = var.storage_bucket
  }

  depends_on = [
    kubernetes_config_map.loki_config
  ]
}

# Service account for Loki (with IRSA for AWS)
resource "kubernetes_service_account" "loki" {
  metadata {
    name      = "${var.cluster_name}-sa"
    namespace = kubernetes_namespace.loki.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = var.iam_role_arn
    }
  }
}

# Outputs
output "namespace" {
  value = kubernetes_namespace.loki.metadata[0].name
}

output "service_name" {
  value = "${var.cluster_name}-loki-gateway"
}

output "endpoint" {
  value = "http://${var.cluster_name}-loki-gateway.${kubernetes_namespace.loki.metadata[0].name}.svc.cluster.local:80"
}
```

#### Object Storage Module (AWS S3)

```hcl
# modules/object-storage/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "retention_days" {
  description = "Days to retain objects before deletion"
  type        = number
  default     = 365
}

variable "enable_versioning" {
  description = "Enable bucket versioning"
  type        = bool
  default     = false
}

# S3 Bucket
resource "aws_s3_bucket" "loki" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Bucket versioning
resource "aws_s3_bucket_versioning" "loki" {
  bucket = aws_s3_bucket.loki.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "loki" {
  bucket = aws_s3_bucket.loki.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle rules for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "loki" {
  bucket = aws_s3_bucket.loki.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {
      prefix = "chunks/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.retention_days
    }
  }

  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "loki" {
  bucket = aws_s3_bucket.loki.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM policy for Loki access
resource "aws_iam_policy" "loki_s3" {
  name        = "${var.bucket_name}-access"
  description = "Policy for Loki to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.loki.arn,
          "${aws_s3_bucket.loki.arn}/*"
        ]
      }
    ]
  })
}

# IAM role for IRSA
resource "aws_iam_role" "loki" {
  name = "${var.bucket_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${var.oidc_provider}:sub" = "system:serviceaccount:${var.namespace}:${var.service_account_name}"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "loki_s3" {
  role       = aws_iam_role.loki.name
  policy_arn = aws_iam_policy.loki_s3.arn
}

output "bucket_name" {
  value = aws_s3_bucket.loki.id
}

output "bucket_arn" {
  value = aws_s3_bucket.loki.arn
}

output "role_arn" {
  value = aws_iam_role.loki.arn
}
```

### GitOps Workflows

#### ArgoCD Application for Loki

```yaml
# argocd/applications/loki.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: loki
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: observability
  
  source:
    repoURL: https://github.com/org/infrastructure.git
    targetRevision: HEAD
    path: kubernetes/loki/overlays/production
    
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  
  # Health checks
  ignoreDifferences:
    - group: apps
      kind: StatefulSet
      jsonPointers:
        - /spec/replicas  # Allow HPA to manage replicas

---
# ArgoCD ApplicationSet for multi-environment deployment
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: loki-environments
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: dev
            cluster: https://dev-cluster.example.com
            values:
              replicas: 1
              retention: 168h
          - env: staging
            cluster: https://staging-cluster.example.com
            values:
              replicas: 2
              retention: 336h
          - env: production
            cluster: https://prod-cluster.example.com
            values:
              replicas: 3
              retention: 744h
  
  template:
    metadata:
      name: 'loki-{{env}}'
    spec:
      project: observability
      source:
        repoURL: https://github.com/org/infrastructure.git
        targetRevision: HEAD
        path: 'kubernetes/loki/overlays/{{env}}'
        helm:
          valueFiles:
            - 'values-{{env}}.yaml'
      destination:
        server: '{{cluster}}'
        namespace: monitoring
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

#### Kustomize Overlay Structure

```yaml
# kubernetes/loki/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - statefulset-ingester.yaml
  - deployment-distributor.yaml
  - deployment-querier.yaml
  - service.yaml
  - servicemonitor.yaml

configMapGenerator:
  - name: loki-config
    files:
      - config.yaml

---
# kubernetes/loki/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: monitoring

resources:
  - ../../base

patches:
  - path: patches/replicas.yaml
  - path: patches/resources.yaml
  - path: patches/storage.yaml

configMapGenerator:
  - name: loki-config
    behavior: merge
    files:
      - config.yaml

images:
  - name: grafana/loki
    newTag: 2.9.2

---
# kubernetes/loki/overlays/production/patches/replicas.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki-ingester
spec:
  replicas: 5

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki-distributor
spec:
  replicas: 3

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki-querier
spec:
  replicas: 4
```

### Configuration Management

#### Hierarchical Configuration with Helm

```yaml
# values/base.yaml - Shared configuration
loki:
  auth_enabled: true
  
  server:
    http_listen_port: 3100
    grpc_listen_port: 9095
    log_level: info
  
  common:
    path_prefix: /var/loki
    replication_factor: 3
  
  schema_config:
    configs:
      - from: 2024-01-01
        store: tsdb
        object_store: s3
        schema: v12
        index:
          prefix: index_
          period: 24h

---
# values/production.yaml - Production overrides
loki:
  server:
    log_level: warn
  
  limits_config:
    ingestion_rate_mb: 50
    ingestion_burst_size_mb: 100
    max_streams_per_user: 50000
    max_query_parallelism: 32
  
  storage:
    bucketNames:
      chunks: loki-prod-chunks
      ruler: loki-prod-ruler
    s3:
      region: us-east-1
      endpoint: s3.us-east-1.amazonaws.com

ingester:
  replicas: 5
  resources:
    requests:
      cpu: "2"
      memory: "4Gi"
    limits:
      cpu: "4"
      memory: "8Gi"
  persistence:
    enabled: true
    size: 50Gi
    storageClass: gp3

querier:
  replicas: 4
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"
```

### Secret Management

#### External Secrets Operator Integration

```yaml
# External secret for S3 credentials
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: loki-s3-credentials
  namespace: monitoring
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  
  target:
    name: loki-s3-credentials
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        AWS_ACCESS_KEY_ID: "{{ .access_key }}"
        AWS_SECRET_ACCESS_KEY: "{{ .secret_key }}"
  
  data:
    - secretKey: access_key
      remoteRef:
        key: loki/s3-credentials
        property: access_key
    - secretKey: secret_key
      remoteRef:
        key: loki/s3-credentials
        property: secret_key

---
# Sealed Secret for GitOps (alternative approach)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: loki-auth-token
  namespace: monitoring
spec:
  encryptedData:
    token: AgBy8hCi...encrypted...data==
  template:
    metadata:
      name: loki-auth-token
      namespace: monitoring
    type: Opaque
```

#### HashiCorp Vault Integration

```hcl
# Vault policy for Loki
path "secret/data/loki/*" {
  capabilities = ["read"]
}

path "aws/creds/loki-s3" {
  capabilities = ["read"]
}
```

```yaml
# Vault Agent Injector annotations
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki-ingester
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "loki"
        vault.hashicorp.com/agent-inject-secret-s3: "aws/creds/loki-s3"
        vault.hashicorp.com/agent-inject-template-s3: |
          {{- with secret "aws/creds/loki-s3" -}}
          export AWS_ACCESS_KEY_ID="{{ .Data.access_key }}"
          export AWS_SECRET_ACCESS_KEY="{{ .Data.secret_key }}"
          {{- end -}}
```

### Environment Promotion Strategies

#### Progressive Delivery with Argo Rollouts

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: loki-querier
  namespace: monitoring
spec:
  replicas: 4
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: {duration: 5m}
        - setWeight: 25
        - pause: {duration: 10m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      
      # Automatic rollback on failure
      analysis:
        templates:
          - templateName: loki-success-rate
        startingStep: 1
        args:
          - name: service-name
            value: loki-querier
      
      # Traffic management
      trafficRouting:
        istio:
          virtualService:
            name: loki-querier
            routes:
              - primary

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: loki-success-rate
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] >= 0.99
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus:9090
          query: |
            sum(rate(loki_request_duration_seconds_count{
              service="{{args.service-name}}",
              status_code!~"5.."
            }[5m])) /
            sum(rate(loki_request_duration_seconds_count{
              service="{{args.service-name}}"
            }[5m]))
```

#### Environment Promotion Pipeline

```yaml
# .github/workflows/promote.yaml
name: Environment Promotion

on:
  workflow_dispatch:
    inputs:
      source_env:
        description: 'Source environment'
        required: true
        type: choice
        options:
          - dev
          - staging
      target_env:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate promotion path
        run: |
          if [[ "${{ inputs.source_env }}" == "dev" && "${{ inputs.target_env }}" == "production" ]]; then
            echo "Cannot promote directly from dev to production"
            exit 1
          fi
      
      - name: Run integration tests
        run: |
          ./scripts/integration-tests.sh ${{ inputs.source_env }}

  promote:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Get current version
        id: version
        run: |
          VERSION=$(cat environments/${{ inputs.source_env }}/version.txt)
          echo "version=$VERSION" >> $GITHUB_OUTPUT
      
      - name: Update target environment
        run: |
          # Update version file
          echo "${{ steps.version.outputs.version }}" > environments/${{ inputs.target_env }}/version.txt
          
          # Copy configuration (with environment-specific overrides)
          cp environments/${{ inputs.source_env }}/values.yaml environments/${{ inputs.target_env }}/values.yaml
          
          # Apply environment-specific patches
          yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' \
            environments/${{ inputs.target_env }}/values.yaml \
            environments/${{ inputs.target_env }}/overrides.yaml \
            > environments/${{ inputs.target_env }}/values.yaml.tmp
          mv environments/${{ inputs.target_env }}/values.yaml.tmp environments/${{ inputs.target_env }}/values.yaml
      
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Promote ${{ steps.version.outputs.version }} to ${{ inputs.target_env }}"
          body: |
            Promoting version ${{ steps.version.outputs.version }} from ${{ inputs.source_env }} to ${{ inputs.target_env }}.
            
            ## Changes
            - Updated version to ${{ steps.version.outputs.version }}
            - Synced configuration from ${{ inputs.source_env }}
            
            ## Checklist
            - [ ] Integration tests passed
            - [ ] Canary deployment successful
            - [ ] Rollback plan documented
          branch: promote/${{ inputs.target_env }}/${{ steps.version.outputs.version }}
```

---

## Related Resources

### Internal References
- [LGTM Stack](../../shared-concepts/lgtm-stack.md) - Comprehensive LGTM stack documentation
- [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md) - Core Kubernetes concepts
- [Observability Principles](../../shared-concepts/observability-principles.md) - Three pillars and instrumentation
- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md) - Grafana architecture overview

### Code Implementations
- [Go Distributed Systems](../../code-implementations/go-distributed-systems/) - Concurrency and distributed patterns
- [Kubernetes Configs](../../code-implementations/kubernetes-configs/) - Deployment manifests and operators
- [Observability Patterns](../../code-implementations/observability-patterns/) - Instrumentation examples

### External Resources
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Grafana Labs Engineering Blog](https://grafana.com/blog/engineering/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
