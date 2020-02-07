export function probeHealthStatus(): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener("load", ev => {
      resolve(xhr.responseText);
    });

    xhr.addEventListener("error", err => {
      reject(err);
    });

    xhr.open("GET", document.location.origin);
    xhr.send();
  });
}

export function sleep(ms: number): Promise<never> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
