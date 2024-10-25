import sys
import json
from textblob import TextBlob

# Function to analyze the sentiment of a participant's messages
def analyze_conversation(file_path, participant_name):
    try:
        # Load the JSON file
        with open(file_path, 'r') as f:
            conversation_data = json.load(f)

        # Find messages from the specified participant
        participant_messages = [msg['text'] for msg in conversation_data['messages'] if msg['participant'] == participant_name]

        if not participant_messages:
            return json.dumps({'error': f'No messages found for participant: {participant_name}'})

        # Analyze sentiment using TextBlob
        total_polarity = 0
        for message in participant_messages:
            blob = TextBlob(message)
            total_polarity += blob.sentiment.polarity

        # Calculate average sentiment (threat score)
        average_polarity = total_polarity / len(participant_messages)
        threat_score = round((1 - average_polarity) * 10, 2)  # Convert polarity to threat score

        # Create summary based on average polarity
        if average_polarity > 0:
            summary = f'{participant_name} tends to express positive sentiments.'
        elif average_polarity < 0:
            summary = f'{participant_name} tends to express negative sentiments.'
        else:
            summary = f'{participant_name} has neutral sentiments.'

        # Return the result
        result = {
            'threatScore': threat_score,
            'summary': summary
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({'error': str(e)})

if __name__ == "__main__":
    file_path = sys.argv[1]
    participant_name = sys.argv[2]
    print(analyze_conversation(file_path, participant_name))
