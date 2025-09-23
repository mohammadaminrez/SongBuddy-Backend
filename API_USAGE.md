# SongBuddy Backend API Usage

## User Management API

### Save User Data (POST /api/users/save)

This endpoint is designed to receive user data from your Flutter app and save it to the database.

**URL:** `http://localhost:3000/api/users/save`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Required Fields:
- `id` (string): Unique user identifier from your Flutter app
- `displayName` (string): User's display name
- `email` (string): User's email address

#### Optional Fields:
- `username` (string): User's username (nullable)
- `profilePicture` (string): URL to user's profile picture (nullable)
- `country` (string): User's country (nullable)
- `bio` (string): User's bio/description (nullable)

#### Example Request Body:
```json
{
  "id": "user_12345",
  "displayName": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "profilePicture": "https://example.com/profile.jpg",
  "country": "United States",
  "bio": "Music lover and developer"
}
```

#### Success Response (201 Created / 200 Updated):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_12345",
    "displayName": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "profilePicture": "https://example.com/profile.jpg",
    "country": "United States",
    "bio": "Music lover and developer",
    "isActive": true,
    "lastActiveAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses:

**400 Bad Request - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Missing required fields: id, displayName, and email are required",
  "error": "VALIDATION_ERROR"
}
```

**400 Bad Request - Invalid Email:**
```json
{
  "success": false,
  "message": "Invalid email format",
  "error": "INVALID_EMAIL"
}
```

**409 Conflict - Email Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists with a different user",
  "error": "EMAIL_CONFLICT"
}
```

### Get User by ID (GET /api/users/:id)

**URL:** `http://localhost:3000/api/users/{user_id}`  
**Method:** `GET`

#### Success Response (200):
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user_12345",
    "displayName": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "profilePicture": "https://example.com/profile.jpg",
    "country": "United States",
    "bio": "Music lover and developer",
    "followersCount": 0,
    "followingCount": 0,
    "isActive": true,
    "lastActiveAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get All Users (GET /api/users)

**URL:** `http://localhost:3000/api/users`  
**Method:** `GET`  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of users per page (default: 10)

#### Success Response (200):
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "user_12345",
      "displayName": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "profilePicture": "https://example.com/profile.jpg",
      "country": "United States",
      "bio": "Music lover and developer",
      "followersCount": 0,
      "followingCount": 0,
      "lastActiveAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Flutter Integration Example

Here's how you can integrate this API in your Flutter app:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class UserService {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Save user data
  static Future<Map<String, dynamic>> saveUser({
    required String id,
    required String displayName,
    required String email,
    String? username,
    String? profilePicture,
    String? country,
    String? bio,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/users/save'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'id': id,
          'displayName': displayName,
          'email': email,
          'username': username,
          'profilePicture': profilePicture,
          'country': country,
          'bio': bio,
        }),
      );

      final data = json.decode(response.body);
      
      if (data['success']) {
        return data['data'];
      } else {
        throw Exception(data['message']);
      }
    } catch (e) {
      throw Exception('Failed to save user: $e');
    }
  }
  
  // Get user by ID
  static Future<Map<String, dynamic>> getUser(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/$id'),
      );

      final data = json.decode(response.body);
      
      if (data['success']) {
        return data['data'];
      } else {
        throw Exception(data['message']);
      }
    } catch (e) {
      throw Exception('Failed to get user: $e');
    }
  }
}
```

## Testing the API

You can test the API using curl or any HTTP client:

```bash
# Test saving a user
curl -X POST http://localhost:3000/api/users/save \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user_12345",
    "displayName": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "profilePicture": "https://example.com/profile.jpg",
    "country": "United States",
    "bio": "Music lover and developer"
  }'

# Test getting a user
curl http://localhost:3000/api/users/user_12345

# Test getting all users
curl http://localhost:3000/api/users
```

## Notes

- The API automatically handles user updates if a user with the same `id` already exists
- Email addresses are automatically converted to lowercase
- All timestamps are in ISO format
- The API includes proper error handling and validation
- CORS is configured to allow requests from your Flutter app
