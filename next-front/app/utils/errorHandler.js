
export function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    if (status === 429) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Error", 
          body: `Too Many Requests. Please try again in ${error.response.data.timeout_in_seconds} seconds`, 
          delay: 5000,
          variant: "danger",
        }
      }));
    } else if (status === 400) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Error",
          body: error.response.data.errors[0], 
          delay: 5000,
          variant: "danger",
        }
      }));
    }else if (status === 401) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Error",
          body: "Authentication Error", 
          delay: 5000,
          variant: "danger",
        }
      }));
    }
     else if (status === 404) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Error", 
          body: "API not found", 
          delay: 5000,
          variant: "danger",
        }
      }));
    }
  } else if (error.request) {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        title: "Error", 
        body: "Server Connection Error", 
        delay: 3000,
        variant: "danger",
      }
    }));
  } else {
    console.error("Error", error.message);
    window.dispatchEvent(new CustomEvent('showToast', { 
      detail: { 
        title: "Error",
        body: "Unknown Error",
        delay: 3000,
        variant: "danger",
      } 
    }));
  }
}
