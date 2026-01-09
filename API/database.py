from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings


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
    client: AsyncIOMotorClient = None
    db = None


db = Database()


async def connect_to_mongo():
    """Create database connection."""
    db.client = AsyncIOMotorClient(settings.mongodb_uri)
    db.db = db.client[settings.database_name]
    print(f"Connected to MongoDB: {settings.database_name}")


async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")


def get_database():
    """Get database instance."""
    return db.db

