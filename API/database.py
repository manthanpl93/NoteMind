from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from mongomock_motor import AsyncMongoMockClient
import os


class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str
    jwt_secret: str
    encryption_key: str

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env file


settings = Settings()


class Database:
    client = None
    db = None


db = Database()


async def connect_to_mongo():
    """Create database connection."""
    # Check if we're in testing mode - only use mock DB when explicitly set to true
    testing_env = os.getenv("TESTING", "").strip().lower()
    use_mock_db = testing_env == "true"

    if use_mock_db:
        # Use mock database for testing ONLY
        db.client = AsyncMongoMockClient()
        db.db = db.client[settings.database_name]
        print(f"Using mock database for testing: {settings.database_name}")
    else:
        # Production/Development: Use real MongoDB
        try:
            db.client = AsyncIOMotorClient(settings.mongodb_uri)
            # Test the connection
            await db.client.admin.command('ping')
            db.db = db.client[settings.database_name]
            print(f"Connected to MongoDB: {settings.database_name}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            print("Please ensure MongoDB is running and accessible.")
            print(f"MongoDB URI: {settings.mongodb_uri}")
            raise  # Re-raise the exception to prevent startup


async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        print("Database connection closed")


def get_database():
    """Get database instance."""
    return db.db

