# School Forum System - Login & Authentication Flow 🔐

## Complete Authentication Flow Diagram

```mermaid
graph TD
    A[User Visits Site] --> B{Is Authenticated?}
    
    B -->|No| C[Show Login Page]
    B -->|Yes| D[Check User Status]
    
    C --> E[User Enters Credentials]
    E --> F[Frontend Validation]
    F -->|Invalid| G[Show Validation Errors]
    G --> E
    F -->|Valid| H[Send Login Request to Backend]
    
    H --> I[Backend: Validate Credentials]
    I -->|Invalid| J[Return Error Message]
    J --> K[Show Login Error]
    K --> E
    
    I -->|Valid| L[Backend: Check User Status]
    L --> M{User Status?}
    
    M -->|pending| N[Show Pending Approval Message]
    M -->|suspended| O[Show Account Suspended]
    M -->|banned| P[Show Account Banned]
    M -->|active| Q[Generate JWT Token]
    
    Q --> R[Return User Data + Token]
    R --> S[Frontend: Save Auth Data]
    S --> T[Set User Context]
    T --> U[Role-Based Redirect]
    
    U --> V{User Role?}
    V -->|admin| W[Redirect to Admin Panel]
    V -->|moderator| X[Redirect to General Forum]
    V -->|student| Y[Redirect to Dashboard]
    
    D --> Z{Status Check}
    Z -->|active| AA[Allow Access]
    Z -->|pending/suspended/banned| BB[Redirect to Access Denied]
    
    AA --> CC[Load User Interface]
    CC --> DD[Check Permissions for Each Action]
```

## Detailed Authentication States

### 1. Initial Load Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant LS as LocalStorage
    participant B as Backend
    participant DB as Database

    U->>F: Visit Site
    F->>LS: Check stored token & user
    alt Token exists
        F->>F: Validate token format
        F->>B: Verify token validity
        B->>DB: Check user status
        DB-->>B: Return user data
        B-->>F: Return updated user info
        F->>F: Set authenticated state
        F->>U: Show authenticated UI
    else No token
        F->>U: Show login page
    end
```

### 2. Login Process Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant E as Email Service

    U->>F: Enter email & password
    F->>F: Client-side validation
    F->>B: POST /api/auth/login
    B->>B: Validate input
    B->>DB: Find user by email
    DB-->>B: Return user data
    B->>B: Compare password hash
    alt Valid credentials
        B->>B: Check user status
        alt Status: active
            B->>B: Generate JWT token
            B-->>F: Return token + user data
            F->>LS: Save token & user
            F->>F: Set auth context
            F->>U: Redirect based on role
        else Status: pending
            B-->>F: Return pending status
            F->>U: Show "Awaiting approval"
        else Status: suspended/banned
            B-->>F: Return error
            F->>U: Show account status message
        end
    else Invalid credentials
        B-->>F: Return error
        F->>U: Show login error
    end
```

### 3. Registration Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant E as Email Service

    U->>F: Fill registration form
    F->>F: Client-side validation
    F->>B: POST /api/auth/register
    B->>B: Server-side validation
    B->>DB: Check if email exists
    alt Email available
        B->>B: Hash password
        B->>DB: Create user (status: pending)
        B->>B: Generate verification token
        B->>E: Send verification email
        B-->>F: Registration successful
        F->>U: Show "Check email" message
        U->>E: Click verification link
        E->>B: GET /api/auth/verify/:token
        B->>DB: Update email_verified = true
        B-->>U: Show "Email verified" page
    else Email exists
        B-->>F: Return error
        F->>U: Show "Email already registered"
    end
```

### 4. Role-Based Access Control
```mermaid
graph TD
    A[User Authenticated] --> B{Check User Role}
    
    B -->|Admin| C[Full System Access]
    C --> C1[User Management]
    C --> C2[All Forums Access]
    C --> C3[System Settings]
    C --> C4[Analytics Dashboard]
    
    B -->|Moderator| D[Moderation Access]
    D --> D1[All Forums Access]
    D --> D2[Content Moderation]
    D --> D3[User Reports]
    D --> D4[Limited Admin Features]
    
    B -->|Student| E{Check Year Level}
    E -->|G11| F[G11 Student Access]
    F --> F1[General Forum]
    F --> F2[G11 Forum Only]
    F --> F3[Profile Management]
    F --> F4[Messaging]
    
    E -->|G12| G[G12 Student Access]
    G --> G1[General Forum]
    G --> G2[G12 Forum Only]
    G --> G3[Profile Management]
    G --> G4[Messaging]
    
    B -->|Contributor| H[Enhanced Student Access]
    H --> H1[All Student Features]
    H --> H2[Content Creation Tools]
    H --> H3[Special Badges]
```

## Authentication Components Architecture

### Frontend Components
```
src/
├── contexts/
│   └── AuthContext.js          # Global auth state management
├── components/
│   └── Auth/
│       ├── ProtectedRoute.js   # Route protection wrapper
│       └── LoginForm.js        # Login form component
├── pages/
│   ├── Login.js               # Login page
│   ├── Register.js            # Registration page
│   ├── VerifyEmail.js         # Email verification
│   ├── ForgotPassword.js      # Password reset request
│   ├── ResetPassword.js       # Password reset form
│   └── AccessDenied.js        # Access denied page
└── services/
    └── api.js                 # API service layer
```

### Backend Routes
```
backend/src/routes/
└── auth.js
    ├── POST /register         # User registration
    ├── POST /login           # User login
    ├── POST /logout          # User logout
    ├── GET /verify/:token    # Email verification
    ├── POST /forgot-password # Password reset request
    ├── POST /reset-password  # Password reset
    ├── GET /me              # Get current user
    └── PUT /update-profile  # Update user profile
```

## User Status States

### Status Definitions
```javascript
const USER_STATUSES = {
  pending: {
    description: "Awaiting admin approval",
    canLogin: true,
    canAccessForums: false,
    canPost: false,
    message: "Your account is pending approval. Please wait for admin verification."
  },
  active: {
    description: "Full access granted",
    canLogin: true,
    canAccessForums: true,
    canPost: true,
    message: "Welcome! You have full access to the forum."
  },
  suspended: {
    description: "Temporarily suspended",
    canLogin: true,
    canAccessForums: false,
    canPost: false,
    message: "Your account has been temporarily suspended. Contact admin for details."
  },
  banned: {
    description: "Permanently banned",
    canLogin: false,
    canAccessForums: false,
    canPost: false,
    message: "Your account has been banned. Contact admin if you believe this is an error."
  }
};
```

### Role Hierarchy
```javascript
const ROLE_HIERARCHY = {
  admin: {
    level: 4,
    permissions: ["*"], // All permissions
    canAccess: ["admin", "all_forums", "user_management", "system_settings"]
  },
  moderator: {
    level: 3,
    permissions: ["moderate", "access_all_forums", "manage_content"],
    canAccess: ["all_forums", "moderation_tools", "user_reports"]
  },
  contributor: {
    level: 2,
    permissions: ["enhanced_posting", "special_features"],
    canAccess: ["grade_forum", "general_forum", "contributor_tools"]
  },
  student: {
    level: 1,
    permissions: ["basic_posting", "messaging"],
    canAccess: ["grade_forum", "general_forum", "profile"]
  }
};
```

## Security Features

### JWT Token Management
```javascript
// Token structure
{
  "userId": 123,
  "email": "user@school.edu",
  "role": "student",
  "status": "active",
  "iat": 1640995200,
  "exp": 1641081600
}

// Token validation middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Password Security
```javascript
// Password requirements
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
};

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};
```

## Error Handling

### Authentication Errors
```javascript
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH001',
    message: 'Invalid email or password',
    status: 401
  },
  ACCOUNT_PENDING: {
    code: 'AUTH002',
    message: 'Account pending approval',
    status: 403
  },
  ACCOUNT_SUSPENDED: {
    code: 'AUTH003',
    message: 'Account temporarily suspended',
    status: 403
  },
  ACCOUNT_BANNED: {
    code: 'AUTH004',
    message: 'Account permanently banned',
    status: 403
  },
  TOKEN_EXPIRED: {
    code: 'AUTH005',
    message: 'Session expired, please login again',
    status: 401
  },
  EMAIL_NOT_VERIFIED: {
    code: 'AUTH006',
    message: 'Please verify your email address',
    status: 403
  }
};
```

## Session Management

### Frontend Session Handling
```javascript
// AuthContext session management
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session on app load
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token is still valid
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);
  
  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return { success: true, user };
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
};
```

## Testing Authentication Flow

### Test Scenarios
```javascript
describe('Authentication Flow', () => {
  test('successful login redirects based on role', async () => {
    // Test admin login -> admin panel
    // Test moderator login -> general forum
    // Test student login -> dashboard
  });
  
  test('handles different user statuses', async () => {
    // Test pending user -> shows pending message
    // Test suspended user -> shows suspended message
    // Test banned user -> prevents login
  });
  
  test('token expiration handling', async () => {
    // Test expired token -> redirects to login
    // Test token refresh -> maintains session
  });
  
  test('role-based access control', async () => {
    // Test student cannot access admin routes
    // Test G11 student cannot access G12 forum
  });
});
```

This comprehensive flow covers all aspects of your login system, from initial authentication to role-based access control and session management.