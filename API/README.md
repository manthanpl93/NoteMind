# NoteMind API

FastAPI backend for NoteMind application.

## Setup

1. Create a virtual environment:
```bash
cd API
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your MongoDB connection:
```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=notemind
```

4. Run the server:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload
```

## API Endpoints

### Health Check
- `GET /` - Returns API status

### Users
- `POST /users` - Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "id": "mongodb_object_id",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

