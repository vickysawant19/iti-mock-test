import fs from 'fs';
import csv from 'csv-parser';

fs.createReadStream('d:/WebDev/iti-mock-test/scripts/files/temp_practical.csv')
  .pipe(csv())
  .on('data', (data) => {
    if (data.moduleId === 'P1') {
      let rawEval = data['evalutionsPoints[]'];
      if (rawEval && rawEval !== '[]') {
        if (rawEval.startsWith('[') && rawEval.endsWith(']')) {
           let stripped = rawEval.substring(2, rawEval.length - 2); 
           let items = stripped.split(/}","{/);
           
           let parsedItems = items.map(item => {
               let clean = item;
               if (!clean.startsWith('{')) clean = '{' + clean;
               if (!clean.endsWith('}')) clean = clean + '}';
               return clean;
           });
           
           parsedItems.forEach(i => {
               try {
                   JSON.parse(i);
                   console.log('OK:', i);
               } catch(e) {
                   console.error('FAIL:', i, 'Error:', e.message);
               }
           });
        }
      }
    }
  });
