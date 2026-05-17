
export const recordDropView = (dropId: string, userId: string): void => {
  fetch('/api/view/drop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dropId, userId }),
    // keepalive ensures the request is sent even if the user navigates away.
    keepalive: true,
  }).catch(error => {
    console.error("[CLIENT_VIEW_PROCESSOR] Failed to send view request:", error);
  });
};
