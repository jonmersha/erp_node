export const syncLogToRemote = async (logEntry) => {
  const remoteUrl = process.env.REMOTE_AUDIT_LOG_URL;
  
  if (!remoteUrl) {
    // If no remote URL is configured, skip silently
    return;
  }

  try {
    const response = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    });
    
    if (!response.ok) {
      console.error(`Failed to sync audit log to remote server: ${response.statusText}`);
    }
  } catch (err) {
    console.error(`Error syncing audit log to remote server: ${err.message}`);
  }
};
