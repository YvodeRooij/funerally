const fs = require('fs');
const glob = require('glob');

// Find all API route files
const files = [
  '/workspaces/farewelly/app/api/venue/analytics/route.ts',
  '/workspaces/farewelly/app/api/venue/availability/route.ts',
  '/workspaces/farewelly/app/api/venue/bookings/route.ts',
  '/workspaces/farewelly/app/api/family/chat/rooms/route.ts',
  '/workspaces/farewelly/app/api/family/chat/route.ts',
  '/workspaces/farewelly/app/api/family/profile/route.ts',
  '/workspaces/farewelly/app/api/family/documents/route.ts',
  '/workspaces/farewelly/app/api/family/documents/[id]/route.ts',
  '/workspaces/farewelly/app/api/family/bookings/route.ts',
  '/workspaces/farewelly/app/api/family/bookings/[id]/route.ts',
  '/workspaces/farewelly/app/api/payments/route.ts',
  '/workspaces/farewelly/app/api/payments/[id]/refund/route.ts',
  '/workspaces/farewelly/app/api/payments/splits/route.ts',
  '/workspaces/farewelly/app/api/documents/route.ts',
  '/workspaces/farewelly/app/api/documents/[id]/route.ts',
  '/workspaces/farewelly/app/api/documents/share/route.ts',
  '/workspaces/farewelly/app/api/director/venues/route.ts',
  '/workspaces/farewelly/app/api/director/clients/route.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Fixing ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix export syntax patterns
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((GET)\)\s+as\s+GET\s*\n\s*}/,
      'export const GET_Handler = withErrorHandling(GET);\nexport { GET_Handler as GET };'
    );
    
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((GET)\)\s+as\s+GET,\s*\n\s*withErrorHandling\((POST)\)\s+as\s+POST\s*\n\s*}/,
      'export const GET_Handler = withErrorHandling(GET);\nexport const POST_Handler = withErrorHandling(POST);\nexport { GET_Handler as GET, POST_Handler as POST };'
    );
    
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((GET)\)\s+as\s+GET,\s*\n\s*withErrorHandling\((PUT)\)\s+as\s+PUT,\s*\n\s*withErrorHandling\((DELETE)\)\s+as\s+DELETE\s*\n\s*}/,
      'export const GET_Handler = withErrorHandling(GET);\nexport const PUT_Handler = withErrorHandling(PUT);\nexport const DELETE_Handler = withErrorHandling(DELETE);\nexport { GET_Handler as GET, PUT_Handler as PUT, DELETE_Handler as DELETE };'
    );
    
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((POST)\)\s+as\s+POST\s*\n\s*}/,
      'export const POST_Handler = withErrorHandling(POST);\nexport { POST_Handler as POST };'
    );
    
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((PUT)\)\s+as\s+PUT\s*\n\s*}/,
      'export const PUT_Handler = withErrorHandling(PUT);\nexport { PUT_Handler as PUT };'
    );
    
    content = content.replace(
      /export\s*{\s*\n\s*withErrorHandling\((DELETE)\)\s+as\s+DELETE\s*\n\s*}/,
      'export const DELETE_Handler = withErrorHandling(DELETE);\nexport { DELETE_Handler as DELETE };'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('All files fixed!');