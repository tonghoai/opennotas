function newFlexSearch() {
  return new (window as any).FlexSearch.Document({
    doc: {
      id: "id",
      field: ["content"]
    }
  });
}

function addToFlexSearch(index: any, data: any) {
  index.add(data);
}

export {
  newFlexSearch,
  addToFlexSearch,
};
