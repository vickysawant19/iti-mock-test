
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MockTestGreet = () => {
    const navigate = useNavigate();
    const {paperId} = useParams()

    const startExam = () => {
        // Navigate to the exam start page or generate a new question paper
        navigate(`/start-exam/${paperId}`);
    };

    return (
        <div className="mock-test-page">
            <h1>Welcome to the Mock Test</h1>
            <p><strong>Exam Rules:</strong></p>
            <ul>
                <li>Duration: 1 hour</li>
                <li>Number of Questions: 50</li>
                <li>Each question carries equal marks</li>
                <li>No negative marking</li>
                <li>Ensure you are in a quiet environment</li>
            </ul>
            <p>Make sure you have read the instructions carefully before starting the exam.</p>
            <button onClick={startExam}>Start Exam</button>
        </div>
    );
};

export default MockTestGreet;
