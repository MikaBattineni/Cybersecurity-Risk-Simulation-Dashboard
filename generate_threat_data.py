import json
import random
import datetime

# Configuration for a rich dataset
records = 300
start_date = datetime.date(2024, 1, 1)

threat_types = [
    "Deepfake Phishing", "Voice Cloning Scam", "Prompt Injection", 
    "AI-Polymorphic Malware", "Model Poisoning", "Autonomous Botnet"
]
sectors = ["Finance", "Healthcare", "Defense", "Education", "Tech"]
countries = [
    {"name": "USA", "coords": [-95.71, 37.09]},
    {"name": "China", "coords": [104.19, 35.86]},
    {"name": "Russia", "coords": [105.31, 61.52]},
    {"name": "India", "coords": [78.96, 20.59]},
    {"name": "Brazil", "coords": [-51.92, -14.23]},
    {"name": "Germany", "coords": [10.45, 51.16]},
    {"name": "UK", "coords": [-3.43, 55.37]},
    {"name": "Nigeria", "coords": [8.67, 9.08]}
]

data = []

for i in range(records):
    # Random date
    curr_date = start_date + datetime.timedelta(days=random.randint(0, 365))
    
    # Source and Target (Make sure they are different)
    source = random.choice(countries)
    target = random.choice(countries)
    while target == source:
        target = random.choice(countries)

    record = {
        "id": i,
        "date": curr_date.strftime("%Y-%m-%d"),
        "timestamp": curr_date.strftime("%Y-%m-%d %H:%M:%S"),
        "type": random.choice(threat_types),
        "severity": random.randint(1, 10), # 1 = Low, 10 = Critical
        "sector": random.choice(sectors),
        "source_country": source["name"],
        "source_coords": source["coords"],
        "target_country": target["name"],
        "target_coords": target["coords"],
        "description": f"Detected {random.choice(threat_types)} attack targeting {random.choice(sectors)} infrastructure."
    }
    data.append(record)

# Save to JSON
with open('ai_threat_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Generated {records} threat records.")