


export function getVariableFromPath(path: string, obj: any): any {
    const segments = path.split('.').filter(Boolean);
    if (obj && segments.length > 1) {
      const relativePath = segments.slice(1).join('.');
      return getVariableFromPath(relativePath, obj[segments[0]]);
    } else if (obj && obj[segments[0]]) {
      return obj;
    } else {
      return null;
    }
  }
  