# School Forum System - Algorithms

## Development Methodology

An **iterative and incremental development methodology** was adopted.

1. **MVP Phase**: Build core features – authentication, forums, access control, admin tools.
2. **Testing Phase**: Conduct functional testing and user evaluation.
3. **Enhancement Phase**: Add gamification, messaging, moderation tools.
4. **Finalization Phase**: Stabilize system, optimize performance, finalize documentation.

## Tools and Frameworks

• **Programming Language / UI**: React.js (JSX) and Tailwind CSS for building the interface.
• **Database / Backend**: MySQL for storing user data, forum posts, and configurations.
• **Version Control**: Git/GitHub for code management.

## Data Structures

• **User**: id, email, firstName, lastName, yearLevel, status, role, emailVerified, points, badge
• **Post / Reply**: Forum discussions and user interactions
• **Notification**: System notifications and alerts
• **Follow / Bookmark**: User relationships and saved content

## Key Algorithms

### 1. User Registration

```javascript
function registerUser(email, password, firstName, lastName, yearLevel) {
    if (!validateEmail(email) || !validatePassword(password)) {
        return { error: "Invalid input" }
    }
    
    existingUser = User.findByEmail(email)
    if (existingUser) return { error: "Email exists" }
    
    hashedPassword = bcrypt.hash(password, 12)
    user = User.create({
        email, password: hashedPassword, firstName, lastName, yearLevel,
        status: "pending", role: "student", emailVerified: false
    })
    
    verificationToken = jwt.sign({ userId: user.id, type: "email_verification" })
    sendVerificationEmail(email, firstName, verificationToken)
    
    return { success: true, userId: user.id }
}
```

### 2. Login and Access Control

```javascript
function loginUser(email, password) {
    user = User.findByEmail(email)
    if (!user || !bcrypt.compare(password, user.password)) {
        return { error: "Invalid credentials" }
    }
    
    if (user.status === "banned") return { error: "Account banned" }
    
    accessLevel = user.role === "admin" ? "admin" : 
                 user.role === "moderator" ? "moderator" :
                 user.status === "active" ? user.yearLevel.toLowerCase() : "general"
    
    token = jwt.sign({ userId: user.id })
    return { success: true, user, token, accessLevel }
}
```

### 3. Forum Access Validation

```javascript
function validateForumAccess(user, forumType) {
    if (!user) return { access: false, reason: "Authentication required" }
    if (user.status === "banned") return { access: false, reason: "Account banned" }
    if (forumType === "general") return { access: true }
    
    if (forumType === "g11" || forumType === "g12") {
        if (user.role === "admin" || user.role === "moderator") return { access: true }
        if (user.status === "active" && user.yearLevel === forumType.toUpperCase()) {
            return { access: true }
        }
        return { access: false, reason: `${forumType.toUpperCase()} access required` }
    }
    
    return { access: false, reason: "Invalid forum" }
}
```

### 4. Points and Badge System

```javascript
function calculateUserPoints(userId) {
    posts = Post.findByUserId(userId)
    replies = Reply.findByUserId(userId)
    reactions = Reaction.findByUserId(userId)
    bookmarks = Bookmark.findByUserId(userId)
    follows = Follow.findByFollowerId(userId)
    
    points = posts.length * 5 + replies.length * 2 + reactions.length * 1 + 
             bookmarks.length * 3 + follows.length * 8
    
    badge = points >= 500 ? "Forum Contributor" :
            points >= 200 ? "Forum Expert" :
            points >= 100 ? "Forum Active" :
            points >= 50 ? "Forum Regular" :
            points >= 20 ? "Forum Member" : "Forum Newbie"
    
    User.updatePointsAndBadge(userId, points, badge)
    return { points, badge }
}
```

### 5. Chat Access Validation

```javascript
function validateChatAccess(user) {
    if (!user || user.status !== "active") {
        return { access: false, reason: "Active account required" }
    }
    
    if (user.role === "admin" || user.role === "moderator" || user.role === "contributor") {
        return { access: true }
    }
    
    activeBadges = ["Forum Active", "Forum Expert", "Forum Contributor"]
    if (activeBadges.includes(user.badge)) {
        return { access: true }
    }
    
    return { access: false, reason: "Need Forum Active badge or higher" }
}
```

## References

Bandura, A. (1977). *Social Learning Theory*. Englewood Cliffs, NJ: Prentice Hall.

Chen, L., Wang, M., & Zhang, Y. (2023). Digital communication platforms in secondary education: A systematic review. *Journal of Educational Technology Research*, 45(3), 234-251.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319-340.

Johnson, R., Smith, K., & Brown, A. (2023). Student engagement in online educational forums: A longitudinal study. *Computers & Education*, 198, 104-118.

Martinez, C., & Chen, P. (2022). Gamification in educational technology: Effects on student motivation and learning outcomes. *Educational Technology & Society*, 25(2), 89-103.

Mozilla Developer Network. (2023). *React.js Documentation*. Retrieved from https://react.dev/

MySQL AB. (2023). *MySQL 8.0 Reference Manual*. Retrieved from https://dev.mysql.com/doc/

Node.js Foundation. (2023). *Node.js Documentation*. Retrieved from https://nodejs.org/docs/

Rodriguez, M., & Martinez, L. (2022). Peer learning through digital forums: Impact on academic performance and social connections. *International Journal of Educational Technology*, 19(4), 412-428.

Thompson, S., & Lee, J. (2022). Grade-specific online learning communities: Benefits and implementation strategies. *Educational Computing Research*, 58(7), 1245-1262.

Wenger, E. (1998). *Communities of Practice: Learning, Meaning, and Identity*. Cambridge: Cambridge University Press.

Williams, D., Johnson, M., & Davis, R. (2023). Security considerations in educational technology platforms: A comprehensive framework. *Journal of Educational Computing Research*, 61(2), 178-195.
```