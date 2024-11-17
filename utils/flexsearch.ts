function newFlexSearch() {
  return new (window as any).FlexSearch.Document({
    document: {
      id: "id",
      index: [{
        field: "content",
        preset: "score",
        tokenize: "reverse",
      }]
    }
  });
}

function addToFlexSearch(index: any, data: any) {
  index.addAsync(data);
}

export {
  newFlexSearch,
  addToFlexSearch,
};
