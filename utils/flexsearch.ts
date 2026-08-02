function newFlexSearch() {
  return new (window as any).FlexSearch.Document({
    document: {
      id: "id",
      store: true,
      index: [{
        field: "content",
        preset: "score",
        tokenize: "default",
      }]
    }
  });
}

function addToFlexSearch(index: any, data: any) {
  return index.addAsync(data);
}

export {
  newFlexSearch,
  addToFlexSearch,
};
