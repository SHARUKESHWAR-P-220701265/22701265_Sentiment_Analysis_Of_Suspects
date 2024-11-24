from flask import Flask, request, jsonify
from textblob import TextBlob
import json
import os

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Parse request JSON
        data = request.json
        file_path = data.get('file_path')
        participant_name = data.get('participant_name')

        # Validate input
        if not file_path or not participant_name:
            return jsonify({'error': 'file_path and participant_name are required'}), 400

        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': f'File not found: {file_path}'}), 404

        # Load the JSON file
        with open(file_path, 'r') as f:
            conversation_data = json.load(f)

        # Extract messages from the specified participant
        participant_messages = [
            msg['content'] for msg in conversation_data.get('messages', [])
            if msg.get('sender_name') == participant_name
        ]

        # Check if messages exist for the participant
        if not participant_messages:
            return jsonify({'error': f'No messages found for participant: {participant_name}'}), 404

        # Analyze sentiment using TextBlob
        total_polarity = sum(TextBlob(message).sentiment.polarity for message in participant_messages)
        average_polarity = total_polarity / len(participant_messages)

        # Calculate threat score
        threat_score = round((1 - average_polarity) * 10, 2)

        # Generate summary based on average polarity
        if average_polarity > 0:
            summary = f'{participant_name} tends to express positive sentiments.'
        elif average_polarity < 0:
            summary = f'{participant_name} tends to express negative sentiments.'
        else:
            summary = f'{participant_name} has neutral sentiments.'

        # Return the results
        return jsonify({
            'threatScore': threat_score,
            'summary': summary,
            'messagesAnalyzed': len(participant_messages)
        })

    except Exception as e:
        # Catch any unexpected errors and return them in the response
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run Flask app on port 5001
    app.run(host='0.0.0.0', port=5001)
