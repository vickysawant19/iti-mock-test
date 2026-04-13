export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.CallExpression).forEach(path => {
    const callee = path.value.callee;
    
    if (callee && callee.type === 'MemberExpression' && callee.property && callee.property.name) {
      const propName = callee.property.name;
      const validMethods = ['listDocuments', 'createDocument', 'updateDocument', 'getDocument', 'deleteDocument'];
      
      if (validMethods.includes(propName)) {
        if (path.value.arguments.length > 0 && path.value.arguments[0].type !== 'ObjectExpression') {
          const args = path.value.arguments;
          let props = [];
          
          if (propName === 'listDocuments') {
            if (args[0]) props.push(j.property('init', j.identifier('databaseId'), args[0]));
            if (args[1]) props.push(j.property('init', j.identifier('collectionId'), args[1]));
            if (args[2]) props.push(j.property('init', j.identifier('queries'), args[2]));
          } else if (propName === 'getDocument' || propName === 'deleteDocument') {
            if (args[0]) props.push(j.property('init', j.identifier('databaseId'), args[0]));
            if (args[1]) props.push(j.property('init', j.identifier('collectionId'), args[1]));
            if (args[2]) props.push(j.property('init', j.identifier('documentId'), args[2]));
          } else if (propName === 'createDocument' || propName === 'updateDocument') {
            if (args[0]) props.push(j.property('init', j.identifier('databaseId'), args[0]));
            if (args[1]) props.push(j.property('init', j.identifier('collectionId'), args[1]));
            if (args[2]) props.push(j.property('init', j.identifier('documentId'), args[2]));
            if (args[3]) props.push(j.property('init', j.identifier('data'), args[3]));
            if (args[4]) props.push(j.property('init', j.identifier('permissions'), args[4]));
          }
          
          path.value.arguments = [j.objectExpression(props)];
        }
      }
    }
  });

  return root.toSource();
}
