"""
Simple script to generate Anki cloze cards from ankit-test.md
"""
import sys
sys.path.insert(0, 'its-my-training-day/_tools/anki-generator')

import re
import hashlib
from pathlib import Path

try:
    import genanki
except ImportError:
    print("Installing genanki...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "genanki"])
    import genanki


def extract_key_concepts(text: str) -> list:
    """Extract key concepts from the system design text."""
    concepts = []
    
    # Define cloze cards directly with context and term to hide
    cloze_definitions = [
        # Stateless architecture
        ("In this stateless architecture, HTTP requests from users can be sent to any web servers, which fetch state data from a shared data store.",
         "shared data store"),
        ("A stateless system is simpler, more robust, and scalable.",
         "stateless"),
        
        # Sticky sessions
        ("This can be done with sticky sessions in most load balancers.",
         "sticky sessions"),
        
        # GeoDNS
        ("geoDNS is a DNS service that allows domain names to be resolved to IP addresses based on the location of a user.",
         "geoDNS"),
        
        # Message queue
        ("A message queue is a durable component, stored in memory, that supports asynchronous communication.",
         "message queue"),
        ("Input services, called producers/publishers, create messages, and publish them to a message queue.",
         "producers/publishers"),
        ("Other services or servers, called consumers/subscribers, connect to the queue, and perform actions defined by the messages.",
         "consumers/subscribers"),
        
        # Database scaling
        ("Vertical scaling, also known as scaling up, is the scaling by adding more power (CPU, RAM, DISK, etc.) to an existing machine.",
         "Vertical scaling"),
        ("Horizontal scaling, also known as sharding, is the practice of adding more servers.",
         "sharding"),
        
        # Sharding
        ("Sharding separates large databases into smaller, more easily managed parts called shards.",
         "shards"),
        ("Sharding key (known as a partition key) consists of one or more columns that determine how data is distributed.",
         "partition key"),
        
        # Sharding challenges
        ("Consistent hashing is a commonly used technique to solve the resharding problem.",
         "Consistent hashing"),
        ("The celebrity problem is also called a hotspot key problem.",
         "hotspot key"),
        
        # Metrics
        ("Host level metrics include CPU, Memory, and disk I/O.",
         "Host level metrics"),
        ("Key business metrics include daily active users, retention, and revenue.",
         "Key business metrics"),
        
        # Summary points
        ("Keep web tier stateless to enable auto-scaling.",
         "stateless"),
        ("Scale your data tier by sharding.",
         "sharding"),
        ("Host static assets in CDN.",
         "CDN"),
    ]
    
    for context, term in cloze_definitions:
        concepts.append({
            'context': context,
            'term': term
        })
    
    return concepts


def create_cloze_cards(concepts: list) -> list:
    """Create Anki cloze cards from concepts."""
    cards = []
    
    for concept in concepts:
        context = concept['context']
        term = concept['term']
        
        # Create cloze deletion
        cloze_text = context.replace(term, f"{{{{c1::{term}}}}}")
        
        # Generate unique ID
        card_id = hashlib.md5(cloze_text.encode()).hexdigest()[:16]
        
        cards.append({
            'id': card_id,
            'front': cloze_text,
            'back': term,
            'tags': ['system-design', 'scaling']
        })
    
    return cards


def export_to_apkg(cards: list, output_path: str):
    """Export cards to APKG format."""
    
    # Create cloze model
    cloze_model = genanki.Model(
        1607392319,
        'System Design Cloze',
        model_type=genanki.Model.CLOZE,
        fields=[
            {'name': 'Text'},
            {'name': 'Extra'},
        ],
        templates=[{
            'name': 'Cloze Card',
            'qfmt': '{{cloze:Text}}',
            'afmt': '{{cloze:Text}}<br><br>{{Extra}}',
        }],
        css='''
        .card {
            font-family: arial;
            font-size: 18px;
            text-align: left;
            color: black;
            background-color: white;
            padding: 20px;
        }
        .cloze {
            font-weight: bold;
            color: blue;
        }
        '''
    )
    
    # Create deck
    deck = genanki.Deck(
        2059400113,
        'Interview Training::System Design'
    )
    
    # Add cards
    for card in cards:
        note = genanki.Note(
            model=cloze_model,
            fields=[card['front'], card['back']],
            tags=card['tags'],
            guid=card['id']
        )
        deck.add_note(note)
    
    # Export
    package = genanki.Package(deck)
    package.write_to_file(output_path)
    
    return len(cards)


def main():
    # Read the markdown file
    content = Path('ankit-test.md').read_text(encoding='utf-8')
    
    # Extract concepts
    concepts = extract_key_concepts(content)
    print(f"Extracted {len(concepts)} concepts")
    
    # Create cards
    cards = create_cloze_cards(concepts)
    print(f"Created {len(cards)} cloze cards")
    
    # Export to APKG
    output_path = 'system-design-scaling.apkg'
    count = export_to_apkg(cards, output_path)
    
    print(f"\nSuccess! Created {output_path} with {count} cards")
    print("\nSample cards:")
    for i, card in enumerate(cards[:3], 1):
        print(f"\n{i}. {card['front'][:100]}...")


if __name__ == '__main__':
    main()
