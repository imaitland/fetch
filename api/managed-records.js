import URI from "urijs";



// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...
async function retrieve({ page = 1, colors = [] } = {}) {

  // "Process pages of 10 items at a time." TODO: expose limit as a function param, e.g. currying.
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
    // First fetch request
    // TODO: parrallelize (Promise.all, Promise.allSettled) this and the second request.
    // TODO: how frequent does this data change? Consider caching. 
    const response = await fetch(url);
    records = await response.json();
  } catch (error) {
    // TODO: improved error handling, e.g. exponential backoff in case of throttling.
    // TODO: improved error logging and monitoring for ops.
    // TODO: improved error messaging, e.g. notifications to user.
    console.log("An error occured", error);
    return null;
  }

  // TODO: Do all data transformations / mappings in one loop.
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

  // Determine if this is the last page of results.
  // TODO: speak with api owner / service team about adding nextPage: true/false to api response.
  if (records.length < limit) {
    // Got back fewer items than the limit so this is the end.
    nextPage = null;
  } else {
    // This could still be the last page we must lookahead 1 more item to see if this is the last page of results for this set of colors
    const req = URI(window.path)
      .addQuery("limit", 1)
      .addQuery("offset", offset + limit);

    // TODO: roll duplicate request logic into helper function, or recur (function will need aditional param).
    if (colors.length > 0) {
      req.setSearch("color[]", colors);
    }

    const url = decodeURIComponent(req.toString());
    let records = [];
    // Second request.
    try {
      const response = await fetch(url);
      records = await response.json();
    } catch (error) {
      console.log("An error occured", error);
      return null;
    }
    // Got 0 back so this is the last page.
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
