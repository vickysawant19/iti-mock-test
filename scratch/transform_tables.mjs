export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Rename appwriteService.getDatabases() to appwriteService.getTablesDB()
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: { name: 'getDatabases' }
    }
  }).forEach(path => {
    path.node.callee.property.name = 'getTablesDB';
  });

  // Rename document methods to row methods
  // And rename 'collectionId' to 'tableId' in the payload if it's an object property
  root.find(j.CallExpression).forEach(path => {
    const callee = path.value.callee;
    
    if (callee && callee.type === 'MemberExpression' && callee.property && callee.property.name) {
      const propName = callee.property.name;
      
      const methodMap = {
        'listDocuments': 'listRows',
        'createDocument': 'createRow',
        'updateDocument': 'updateRow',
        'getDocument': 'getRow',
        'deleteDocument': 'deleteRow'
      };

      if (methodMap[propName]) {
        callee.property.name = methodMap[propName];

        // If the arguments were wrapped in an object by our previous transform
        if (path.value.arguments.length > 0 && path.value.arguments[0].type === 'ObjectExpression') {
          const props = path.value.arguments[0].properties;
          props.forEach(prop => {
            if (prop.key && prop.key.name === 'collectionId') {
              prop.key.name = 'tableId';
            }
            if (prop.key && prop.key.name === 'documentId') {
              prop.key.name = 'rowId'; // Map documentId to rowId
            }
          });
        }
      }
    }
  });

  // Rename response properties (response.documents -> response.rows)
  root.find(j.MemberExpression, {
    property: { name: 'documents' }
  }).forEach(path => {
    if (path.node.property.name === 'documents') {
      path.node.property.name = 'rows';
    }
  });

  return root.toSource();
}
