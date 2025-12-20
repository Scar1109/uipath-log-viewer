
/**
 * Log Parser Utility
 * 
 * Parses raw log lines into structured LogEntry objects.
 * Format: Timestamp Level JSON
 * Example: 00:00:10.0273 Info {"message":"..."}
 */

export const parseLogs = (fileContent) => {
  if (!fileContent) return [];

  const lines = fileContent.split(/\r?\n/);
  const parsedLogs = [];

  // Regex to capture Timestamp, Level, and the JSON part
  // Assumes level is the second token and JSON starts with {
  const logRegex = /^(\S+)\s+(\S+)\s+(\{.*\})$/;

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    const match = line.match(logRegex);

    if (match) {
      const [_, timeStamp, level, jsonString] = match;
      try {
        const jsonData = JSON.parse(jsonString);
        let finalLevel = level;
        let messageContent = jsonData.message || '';

        // Custom Rules for NextGen Billing
        if (messageContent === 'Patient result found and opened.') {
          finalLevel = 'Information';
        }
        if (messageContent.includes('Encounter date not match')) {
          finalLevel = 'Warn';
        }

        // Create a flat object for the table
        parsedLogs.push({
          key: index, // Unique key for Antd table
          rawTimestamp: timeStamp,
          level: finalLevel,
          ...jsonData,
        });
      } catch (e) {
        console.warn(`Failed to parse JSON on line ${index + 1}`, e);
        // Fallback for failed JSON parse (keep raw line accessible)
        parsedLogs.push({
          key: index,
          rawTimestamp: timeStamp,
          level: level,
          message: jsonString, // Treat the rest as message
          parseError: true
        });
      }
    } else {
      // Handle lines that don't match standard format (multiline or plain text)
      parsedLogs.push({
        key: index,
        message: line,
        rawTimestamp: '',
        level: 'Unknown',
        isRaw: true
      });
    }
  });

  return parsedLogs;
};
