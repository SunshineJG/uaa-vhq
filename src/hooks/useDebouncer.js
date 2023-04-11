import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase.config';
import dbouncer from 'dbouncer';

export const useDebouncer = (collectionName, searchKey, delay) => {
  const [searchResult, setSearchResult] = useState([]);

  const executeSearch = useCallback(
    dbouncer((name, callback) => {
      const collectionRef = db.collection(collectionName);
      const q = collectionRef.where('name', '>=', name).where('name', '<=', name +'#uf8ff');
      q.get().then((querySnapshot) => {
        const matchingDocs = [];
        querySnapshot.forEach((doc) => {
          matchingDocs.push({
            id: doc.id,
            data: doc.data()
          });
        });
        callback(matchingDocs);
      });
    }, delay), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collectionName, searchKey]
  );

  useEffect(() => {
    executeSearch(searchKey, (matchingDocs) => {
      setSearchResult(matchingDocs);
    });
  }, [executeSearch, searchKey]);
  
  return searchResult;
}


