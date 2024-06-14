import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...
async function retrieve({ page = 1, colors = [] } = {}) {
  const limit = 10;
  const offset = (page - 1) * limit;

  const req = URI(window.path)
    .addQuery("limit", limit)
    .addQuery("offset", offset);

  if (colors.length > 0) {
    req.setSearch("color[]", colors);
  }

  const url = decodeURIComponent(req.toString());
  let records = [];

  try {
    const response = await fetch(url);
    records = await response.json();
  } catch (error) {
    console.log("An error occured", error);
    return null;
  }

  const ids = records.map(({ id }) => id);
  const recordsWithPrimary = records.map((record) => {
    if (
      record.color === "red" ||
      record.color === "blue" ||
      record.color === "yellow"
    ) {
      record = { ...record, isPrimary: true };
    } else {
      record = { ...record, isPrimary: false };
    }
    return record;
  });
  const open = recordsWithPrimary.filter(
    ({ disposition }) => disposition === "open"
  );
  const closedPrimaryCount = recordsWithPrimary.filter(
    ({ disposition, isPrimary }) => {
      return disposition === "closed" && isPrimary === true;
    }
  ).length;

  let previousPage = page === 1 ? null : page - 1;

  let nextPage = page + 1;

  if (records.length < limit) {
    // Got back fewer items than the limit so this is the end.
    nextPage = null;
  } else {
    // This could still be the last page we must lookahead 1 more item to see if this is the last page of results for this set of colors
    const req = URI(window.path)
      .addQuery("limit", 1)
      .addQuery("offset", offset + limit);

    if (colors.length > 0) {
      req.setSearch("color[]", colors);
    }

    const url = decodeURIComponent(req.toString());
    let records = [];
    try {
      const response = await fetch(url);
      records = await response.json();
    } catch (error) {
      console.log("An error occured", error);
      return null;
    }
    // Got 0 back.
    if (records.length < 1) {
      nextPage = null;
    }
  }

  return {
    ids,
    open,
    closedPrimaryCount,
    previousPage,
    nextPage,
  };

  return null;
}

export default retrieve;
