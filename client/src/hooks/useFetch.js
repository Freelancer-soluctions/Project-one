import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    setController(abortController);

    setLoading(true);
    fetch(url, { signal: abortController.signal })
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((error) => {
        if (error.name === "AbortError") {
          console.log("Fetch aborted request cancelled");
        } else {
          setError(error);
        }
      })
      .finally(setLoading(false));

    return () => abortController.abort();
  }, []);

  const handleCancelRequest = () => {
    if (controller) {
      controller.abort();
      setError("Request cancelled");
    }
  };

  return { data, loading, error, handleCancelRequest };
}

// {loading && <div>loading</div>}
// {error && <div>Error: {error}</div>
// Adaptar un toast para mensaje de error
// <button onClick={handleCancelRequest}>cancel request</button>