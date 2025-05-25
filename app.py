from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Load questions from JSON
with open('questions.json') as f:
    QUESTIONS = json.load(f)

# Path for saved submissions
RESULTS_FILE = 'results.json'

# Load existing submissions if available
if os.path.exists(RESULTS_FILE):
    with open(RESULTS_FILE, 'r') as f:
        submissions = json.load(f)
else:
    submissions = []

@app.route('/')
def quiz():
    return render_template('index.html', questions=QUESTIONS)

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    submissions.append(data)

    # Save submissions to file
    with open(RESULTS_FILE, 'w') as f:
        json.dump(submissions, f, indent=2)

    return jsonify(status='ok', redirect=f"/myresults?name={data['name']}")

@app.route('/myresults')
def my_results():
    name = request.args.get('name')
    submission = next((s for s in submissions if s['name'] == name), None)
    if not submission:
        return "No submission found.", 404

    # Convert string keys to int
    user_answers = {int(k): v for k, v in submission.get('answers', {}).items()}
    # Calculate score
    score = sum(1 for q in QUESTIONS if user_answers.get(q['id']) == q['answer'])
    total = len(QUESTIONS)
    percentage = round(score / total * 100, 2)

    return render_template(
        'myresults.html',
        submission=submission,
        questions=QUESTIONS,
        user_answers=user_answers,
        score=score,
        total=total,
        percentage=percentage
    )

@app.route('/results')
def results_page():
    admin = request.args.get('admin')
    if admin != "admin123":
        return "Unauthorized.", 403

    # Pre-calculate each submission's score
    scored_submissions = []
    for sub in submissions:
        ua = {int(k): v for k, v in sub.get('answers', {}).items()}
        sc = sum(1 for q in QUESTIONS if ua.get(q['id']) == q['answer'])
        scored_submissions.append({**sub, 'score': sc})

    return render_template(
        'results.html',
        submissions=scored_submissions,
        questions=QUESTIONS
    )

if __name__ == '__main__':
    app.run(debug=True)