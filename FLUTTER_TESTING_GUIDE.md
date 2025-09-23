# 🧪 Flutter GET Method Testing Guide

## ✅ **Working Endpoints (No Database Required)**

Your backend is currently running and these endpoints are working:

### **1. Health Check**
```dart
// Test basic server health
final response = await http.get(
  Uri.parse('http://localhost:3000/health'),
);

print('Status: ${response.statusCode}');
print('Body: ${response.body}');
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SongBuddy Backend is running!",
  "timestamp": "2025-09-22T23:20:50.582Z",
  "version": "1.0.0"
}
```

### **2. API Test Endpoint**
```dart
// Test API connectivity
final response = await http.get(
  Uri.parse('http://localhost:3000/api/test'),
);

print('Status: ${response.statusCode}');
print('Body: ${response.body}');
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Backend API is working!",
  "data": {
    "server": "SongBuddy Backend",
    "status": "connected",
    "timestamp": "2025-09-22T23:21:05.071Z"
  }
}
```

## 📱 **Complete Flutter Test Code**

Create a test file in your Flutter project:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class BackendApiService {
  static const String baseUrl = 'http://localhost:3000';
  
  // Test 1: Health Check
  static Future<void> testHealthCheck() async {
    try {
      print('🧪 Testing Health Check...');
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: {'Content-Type': 'application/json'},
      );
      
      print('Status Code: ${response.statusCode}');
      print('Response: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ Health Check: SUCCESS');
      } else {
        print('❌ Health Check: FAILED');
      }
    } catch (e) {
      print('❌ Health Check Error: $e');
    }
  }
  
  // Test 2: API Test Endpoint
  static Future<void> testApiEndpoint() async {
    try {
      print('🧪 Testing API Endpoint...');
      final response = await http.get(
        Uri.parse('$baseUrl/api/test'),
        headers: {'Content-Type': 'application/json'},
      );
      
      print('Status Code: ${response.statusCode}');
      print('Response: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ API Endpoint: SUCCESS');
      } else {
        print('❌ API Endpoint: FAILED');
      }
    } catch (e) {
      print('❌ API Endpoint Error: $e');
    }
  }
  
  // Test 3: Test User Endpoints (Requires MongoDB)
  static Future<void> testUserEndpoints() async {
    try {
      print('🧪 Testing User Endpoints...');
      
      // Test GET all users
      final response = await http.get(
        Uri.parse('$baseUrl/api/users'),
        headers: {'Content-Type': 'application/json'},
      );
      
      print('Status Code: ${response.statusCode}');
      print('Response: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ User Endpoints: SUCCESS');
      } else {
        print('❌ User Endpoints: FAILED (MongoDB not connected)');
      }
    } catch (e) {
      print('❌ User Endpoints Error: $e');
    }
  }
  
  // Test 4: Test User Save (POST)
  static Future<void> testUserSave() async {
    try {
      print('🧪 Testing User Save...');
      
      final userData = {
        'id': 'test_user_123',
        'displayName': 'Test User',
        'email': 'test@example.com',
        'username': 'testuser',
        'country': 'United States'
      };
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/save'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(userData),
      );
      
      print('Status Code: ${response.statusCode}');
      print('Response: ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ User Save: SUCCESS');
      } else {
        print('❌ User Save: FAILED (MongoDB not connected)');
      }
    } catch (e) {
      print('❌ User Save Error: $e');
    }
  }
  
  // Run all tests
  static Future<void> runAllTests() async {
    print('🚀 Starting Backend Tests...\n');
    
    await testHealthCheck();
    print('');
    
    await testApiEndpoint();
    print('');
    
    await testUserEndpoints();
    print('');
    
    await testUserSave();
    print('');
    
    print('🏁 Tests completed!');
  }
}
```

## 🎯 **How to Use in Your Flutter App**

### **1. Add HTTP Dependency**
In your `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
```

### **2. Run Tests**
In your Flutter app:
```dart
import 'package:your_app/backend_api_service.dart';

// In your widget or test
await BackendApiService.runAllTests();
```

### **3. Test Individual Endpoints**
```dart
// Test just the health check
await BackendApiService.testHealthCheck();

// Test just the API endpoint
await BackendApiService.testApiEndpoint();
```

## 🔧 **Troubleshooting**

### **Connection Issues**
- Make sure your backend is running: `npm run dev:simple`
- Check if the URL is correct: `http://localhost:3000`
- For Android emulator, use: `http://10.0.2.2:3000`
- For iOS simulator, use: `http://localhost:3000`

### **CORS Issues**
Your backend already has CORS configured for Flutter apps.

### **MongoDB Required Endpoints**
- `/api/users` - Requires MongoDB
- `/api/users/save` - Requires MongoDB
- `/api/users/:id` - Requires MongoDB

## 📊 **Expected Test Results**

### **With Simple Server (No MongoDB):**
- ✅ `/health` - SUCCESS
- ✅ `/api/test` - SUCCESS  
- ❌ `/api/users` - FAILED (MongoDB not connected)
- ❌ `/api/users/save` - FAILED (MongoDB not connected)

### **With Full Server (MongoDB Connected):**
- ✅ `/health` - SUCCESS
- ✅ `/api/test` - SUCCESS
- ✅ `/api/users` - SUCCESS
- ✅ `/api/users/save` - SUCCESS

## 🚀 **Next Steps**

1. **Test basic endpoints** (working now)
2. **Install MongoDB** to test user endpoints
3. **Test user save functionality**
4. **Integrate with your Flutter app**

Your backend is ready for testing! 🎉
