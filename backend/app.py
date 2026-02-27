import os
import json
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from werkzeug.utils import secure_filename
import csv
from io import StringIO
from flask import make_response
from flask import send_file
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
import io

# 1. IMPORT THE AI LOGIC
from utils.ocr_engine import evaluate_script

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['STUDENT_UPLOADS'] = 'uploads/submissions'

# Ensure upload folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['STUDENT_UPLOADS'], exist_ok=True)

db = SQLAlchemy(app)

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'teacher' or 'student'
    roll_number = db.Column(db.String(50), nullable=True)

class Exam(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    question_paper_path = db.Column(db.String(300))
    answer_key_text = db.Column(db.Text)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exam.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    file_path = db.Column(db.String(300), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    marks_obtained = db.Column(db.Float, default=0.0)
    ai_feedback = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending') # pending, evaluated

with app.app_context():
    db.create_all()

# --- Routes ---

# 1. AUTHENTICATION (With Role Integrity)
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')

    # Security: Ensure email is permanently linked to ONE role only
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            "message": f"Security Alert: This email is already registered as a {existing_user.role.upper()}."
        }), 400 

    new_user = User(
        name=data['name'], 
        email=email, 
        password=data['password'], 
        role=data['role'],
        roll_number=data.get('rollNumber')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created", "userId": new_user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email'], password=data['password']).first()
    if user:
        # We send the role back so the frontend can enforce portal-specific access
        return jsonify({"id": user.id, "name": user.name, "role": user.role})
    return jsonify({"message": "Invalid credentials"}), 401

# 2. EXAM MANAGEMENT (Updated for Deployment Console)
@app.route('/api/create-exam-full', methods=['POST'])
def create_exam_full():
    data = request.json
    try:
        new_exam = Exam(
            title=data['title'],
            subject=data['subject'],
            teacher_id=data['teacherId'],
            # Convert ISO string from React to Python datetime
            start_time=datetime.fromisoformat(data['startTime'].replace('Z', '')),
            end_time=datetime.fromisoformat(data['endTime'].replace('Z', '')),
            answer_key_text=data['markingScheme']  # Stores the question repository text
        )
        db.session.add(new_exam)
        db.session.commit()
        return jsonify({"message": "Exam Deployed Successfully", "examId": new_exam.id}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Failed to deploy exam"}), 500
    
@app.route('/api/exams', methods=['GET'])
def get_exams():
    exams = Exam.query.all()
    return jsonify([{
        "id": e.id, "title": e.title, "subject": e.subject, 
        "end_time": e.end_time.isoformat()
    } for e in exams])


# 3. STUDENT SUBMISSION (With Backend Deadline Lock)
@app.route('/api/upload-script', methods=['POST'])
def upload_script():
    file = request.files['file']
    exam_id = request.form['examId']
    student_id = request.form['studentId']
    
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Exam not found"}), 404

    # Backend Security: Strictly reject files if the deadline has passed
    if datetime.utcnow() > exam.end_time:
        return jsonify({
            "message": "Submission Rejected: The deadline for this examination has passed."
        }), 403

    filename = f"exam_{exam_id}_std_{student_id}_{secure_filename(file.filename)}"
    path = os.path.join(app.config['STUDENT_UPLOADS'], filename)
    file.save(path)
    
    new_sub = Submission(exam_id=exam_id, student_id=student_id, file_path=path)
    db.session.add(new_sub)
    db.session.commit()
    return jsonify({"message": "Submitted successfully"}), 200


# 4. STUDENT RESULTS FLOW (Enhanced for Searching/Filtering)
@app.route('/api/student-results/<int:student_id>', methods=['GET'])
def get_results(student_id):
    results = db.session.query(Submission, Exam).join(Exam, Submission.exam_id == Exam.id)\
                .filter(Submission.student_id == student_id).all()
    
    output = []
    for sub, exam in results:
        output.append({
            "id": sub.id, # <--- ENSURE THIS IS HERE
            "exam_title": exam.title,
            "subject": exam.subject,
            "marks": sub.marks_obtained,
            "feedback": sub.ai_feedback,
            "status": sub.status
        })
    return jsonify(output)


# 5. AI EVALUATION LOGIC
@app.route('/api/evaluate/<int:exam_id>', methods=['POST'])
def evaluate_exam(exam_id):
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Exam not found"}), 404

    submissions = Submission.query.filter_by(exam_id=exam_id, status='pending').all()
    
    if not submissions:
        return jsonify({"message": "No pending scripts to evaluate"}), 404

    for sub in submissions:
        try:
            result_raw = evaluate_script(sub.file_path, exam.answer_key_text)
            
            # Robust JSON cleaning
            cleaned_result = result_raw.strip()
            if "```json" in cleaned_result:
                cleaned_result = cleaned_result.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned_result:
                cleaned_result = cleaned_result.split("```")[1].split("```")[0].strip()

            result = json.loads(cleaned_result)
            
            sub.marks_obtained = result.get('marks', 80)
            sub.ai_feedback = result.get('feedback', "No feedback provided")
            sub.status = 'evaluated'
        except Exception as e:
            print(f"Error evaluating submission {sub.id}: {str(e)}")
            continue

    db.session.commit()
    return jsonify({"message": "Evaluation completed for all scripts!"})

# --- NEW: GOVERNANCE METRICS FOR TEACHER ---
@app.route('/api/teacher-stats', methods=['GET'])
def get_teacher_stats():
    # Fetch real counts from the database
    evaluated_count = Submission.query.filter_by(status='evaluated').count()
    pending_count = Submission.query.filter_by(status='pending').count()
    active_exams = Exam.query.filter(Exam.end_time > datetime.utcnow()).count()
    
    # Calculate Average (Mean Proficiency)
    all_marks = db.session.query(Submission.marks_obtained).filter(Submission.status == 'evaluated').all()
    avg_marks = sum([m[0] for m in all_marks]) / len(all_marks) if all_marks else 0

    return jsonify({
        "evaluated": evaluated_count,
        "pending": pending_count,
        "activeExams": active_exams,
        "missing": 0, # In a real system: Enrollment Strength - Total Submissions
        "meanProficiency": round(avg_marks, 2)
    })

# --- NEW: SEARCH & AUDIT ROUTE ---
@app.route('/api/evaluations/search', methods=['GET'])
def search_evaluations():
    roll = request.args.get('roll')
    exam_id = request.args.get('examId')
    
    query = db.session.query(Submission, User, Exam).join(User, Submission.student_id == User.id).join(Exam, Submission.exam_id == Exam.id)
    
    if roll:
        query = query.filter(User.roll_number.like(f"%{roll}%"))
    if exam_id:
        query = query.filter(Submission.exam_id == exam_id)
        
    results = query.all()
    return jsonify([{
        "id": s.id,
        "roll": u.roll_number,
        "name": u.name,
        "exam": e.title,
        "exam_id": e.id,  
        "marks": s.marks_obtained,
        "status": s.status,
        "feedback": s.ai_feedback,
        "extracted_text": s.file_path
    } for s, u, e in results])

@app.route('/api/download-report/<int:submission_id>', methods=['GET'])
def download_report(submission_id):
    # Fetch the specific submission based on the ID passed from frontend
    sub = Submission.query.get(submission_id)
    if not sub:
        return jsonify({"message": "Submission record not found"}), 404

    # Get associated User and Exam data
    user = User.query.get(sub.student_id)
    exam = Exam.query.get(sub.exam_id)

    # Create a BytesIO buffer to store the PDF in memory
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # --- PDF TEMPLATE DESIGN ---
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width/2, height - 50, "INSTITUTION / UNIVERSITY NAME")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2, height - 65, "Department of Computer Science & Engineering")
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height - 90, "Examination Marksheet Report")
    c.line(50, height - 100, width - 50, height - 100)

    # Student Info Section
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 130, f"Student Name: {user.name}")
    c.drawString(50, height - 145, f"Roll Number: {user.roll_number}")
    c.drawString(width - 200, height - 130, f"Exam: {exam.title}")
    c.drawString(width - 200, height - 145, f"Date: {sub.submitted_at.strftime('%d-%b-%Y')}")

    # Marks Table
    data = [
        ['Subject', 'Max Marks', 'Marks Obtained', 'Status'],
        [exam.subject, '100', str(sub.marks_obtained), 'PASS' if sub.marks_obtained >= 40 else 'FAIL']
    ]
    table = Table(data, colWidths=[200, 80, 100, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.slategrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ]))
    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 250)

    # AI Evaluation Details
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 300, "AI EVALUATION FEEDBACK")
    c.setFont("Helvetica-Oblique", 9)
    # Simple text wrap for feedback
    feedback = sub.ai_feedback or "No feedback provided."
    text_obj = c.beginText(50, height - 320)
    text_obj.setLeading(12)
    words = feedback.split()
    line = ""
    for word in words:
        if len(line + word) < 100:
            line += word + " "
        else:
            text_obj.textLine(line)
            line = word + " "
    text_obj.textLine(line)
    c.drawText(text_obj)

    # Signatures
    c.line(50, 120, 200, 120)
    c.drawString(75, 105, "EXAMINER SIGNATURE")
    c.line(width - 200, 120, width - 50, 120)
    c.drawString(width - 165, 105, "HOD SIGNATURE")

    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Marksheet_{user.roll_number}.pdf", mimetype='application/pdf')

if __name__ == '__main__':
    app.run(debug=True, port=5000)