// D:\Mani\Code with Zosh\Backup\source code\frontend\src\util\redableDateTime.ts
export const redableDateTime = (timestamp: string) => {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions  = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // timeZoneName: "short",
  };

  return date.toLocaleString("en-US", options);

};
