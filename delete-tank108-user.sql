-- Delete tank108 user and related data
-- Run this in Azure SQL Query Editor or SSMS

-- First, check if user exists
SELECT Id, Username, Email, IsEmailVerified 
FROM Users 
WHERE Username = 'tank108' OR Email LIKE '%tank108%';

-- Delete related data (if any) - in correct order due to foreign key constraints
-- Note: AuditLogs uses Username, not UserId
DELETE FROM AuditLogs WHERE Username = 'tank108';
DELETE FROM RiskScores WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM SecurityLogs WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM BiometricProfiles WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM KeyStrokes WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM MouseMovements WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM EmailVerificationTokens WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM TwoFactorAuths WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');
DELETE FROM PasswordResetTokens WHERE UserId IN (SELECT Id FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%');

-- Finally, delete the user
DELETE FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%';

-- Verify deletion
SELECT COUNT(*) as RemainingUsers FROM Users WHERE Username = 'tank108' OR Email LIKE '%tank108%';
