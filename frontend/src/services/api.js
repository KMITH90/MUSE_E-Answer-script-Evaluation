import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// 1. Login
export const loginUser = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
};

// 2. Signup
export const signupUser = async (userData) => {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
};

// 3. Create Exam (THIS IS THE ONE CAUSING THE ERROR)
export const createExam = async (formData) => {
    const response = await axios.post(`${API_URL}/create-exam`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};