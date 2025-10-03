
// A specialized error for Firestore permission issues.
// This is used to create rich, contextual errors that can be caught
// by a listener to provide detailed debugging information.

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    // Construct a detailed error message for better logging and debugging
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
{
  "operation": "${context.operation}",
  "path": "${context.path}"
  ${context.requestResourceData ? `,"requestData": ${JSON.stringify(context.requestResourceData, null, 2)}` : ''}
}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
