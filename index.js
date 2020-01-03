/**
 * The following code Polyfills functionality used in this script, in case it is not present on the host
 * browser.
 */
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
  Object.values = function values(O) {
    return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
  };
}

if (!Object.entries) {
  Object.entries = function entries(O) {
    return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
  };
}

// Initialize our state variables
let sequence = null;
const state = {
  csv: null,
  groups: {
    total: null,
    value: []
  },
  isShowingAge: false
};

/**
 * This function is the entrypoint into the application. The script only works if the `FileReader` API is available
 * in the browser. If the API is detected, then the applicatio will be started via this function.
 */
function start() {
  const inputFileSelector = document.getElementById('inputFileSelector');
  inputFileSelector.addEventListener('change', onFileChange);

  const inputNumGroups = document.getElementById('inputNumGroups');
  inputNumGroups.addEventListener('change', onNumGroupsSubmit);

  const buttonBackToFileSelect = document.getElementById('buttonBackToFileSelect');
  buttonBackToFileSelect.addEventListener('click', onBackToFileSelect);

  const buttonGenerateGroups = document.getElementById('buttonGenerateGroups');
  buttonGenerateGroups.addEventListener('click', onGenerateGroupsClick);

  const inputIsShowingAge = document.getElementById('inputIsShowingAge');
  inputIsShowingAge.addEventListener('change', toggleIsShowingAge);

  sequence = createViewSequence('.content', ['fileSelectContainer', 'generatorContainer']);
}

function createViewSequence(target, ids = []) {
  const parent = typeof target === 'string' ? document.querySelector(target) : target;
  let views = ids.map(_init);
  let index = 0;
  let current = views[index];

  function _init(id) {
    const view = document.getElementById(id);
    parent.removeChild(view);
    return view;
  }

  function _advance(direction) {
    parent.removeChild(current);
    index = index += direction;
    current = views[index];
    parent.append(current);
  }

  function next() {
    if (index + 1 >= views.length) return;
    _advance(1);
  }

  function prev() {
    if (index - 1 < 0) return;
    _advance(-1);
  }

  parent.append(current);

  return {
    next,
    prev
  };
}

function toggleIsShowingAge() {
  state.isShowingAge = !state.isShowingAge;
  renderGroups();
}

function onFileChange(event) {
  readAsCsv(event.target.files[0], (err, result) => {
    event.target.value = '';
    onCsvReadComplete(err, result);
  });
}

function readAsCsv(file, cb) {
  let reader = new FileReader();

  reader.onerror = function(event) {
    cb(event.target.error);
  };

  reader.onload = function(event) {
    const [header, ...rows] = csvToArray(event.target.result);
    const headerProps = header.map(h => ({ name: h, prop: camelize(h) }));
    const results = [];
    rows.forEach(row => {
      results.push(row.reduce((acc, cur, i) => ({ ...acc, [headerProps[i].prop]: cur }), {}));
    });
    cb(null, {
      filename: file.name,
      header: headerProps,
      rows: results
    });
  };

  reader.readAsText(file);
}

function onCsvReadComplete(err, result) {
  if (err) return console.error(err);
  state.csv = result;
  sequence.next();
}

function onBackToFileSelect() {
  state.groups.total = null;
  document.getElementById('inputNumGroups').value = '';
  state.groups.value = [];
  empty(document.getElementById('groups'));
  sequence.prev();
}

function onNumGroupsSubmit() {
  state.groups.total = parseInt(document.getElementById('inputNumGroups').value);
}

function empty(element) {
  while (element.firstChild !== null) {
    element.removeChild(element.firstChild);
  }
}

function generateGroups() {
  state.groups.value = [];
  for (let i = 0; i < state.groups.total; ++i) {
    state.groups.value.push([]);
  }
  const rows = [...state.csv.rows];

  let gi = 0;
  while (rows.length > 0) {
    let index = urand(rows.length, true);
    state.groups.value[gi].push(rows[index]);
    rows.splice(index, 1);
    gi = gi + 1 === state.groups.total ? 0 : gi + 1;
  }
}

let nextGroupNumber = 1;
function renderGroups() {
  nextGroupNumber = 1;
  const divGroups = document.getElementById('groups');
  empty(divGroups);

  state.groups.value.forEach(group => {
    const divGroup = createGroup(group);
    divGroups.append(divGroup);
  });
}

function onGenerateGroupsClick() {
  generateGroups();
  renderGroups();
}

function createGroup(group) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');

  const tr = document.createElement('tr');
  Object.values(state.csv.header).forEach(val => {
    if (val.prop === 'age' && !state.isShowingAge) return;
    if (val.prop === 'notes') return;
    const th = document.createElement('th');
    th.append(val.name);
    tr.append(th);
  });

  thead.append(tr);
  table.append(thead);

  const tbody = document.createElement('tbody');
  group.forEach(function(row) {
    const tr = createGroupMember(row);
    tbody.append(tr);
  });

  table.append(tbody);

  const div = document.createElement('div');
  div.className = 'group';

  const h4 = document.createElement('h4');
  h4.append('Group ' + nextGroupNumber);
  div.append(h4);
  div.append(table);

  ++nextGroupNumber;

  return div;
}

function createGroupMember(member) {
  const tr = document.createElement('tr');
  Object.entries(member).forEach(([key, value]) => {
    if (key === 'age' && !state.isShowingAge) return;
    if (key === 'notes') return;
    const td = document.createElement('td');
    td.append(value);
    tr.append(td);
  });
  return tr;
}

/**
 * Converts a RFC 4180 compliant CSV string into an array.
 *
 * Source obtained from Stack Overflow, originally posted by @niry:
 * https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
 *
 * @param {string} text The CSV-formatted string to turn into an array.
 */
function csvToArray(text) {
  let p = '',
    row = [''],
    ret = [row],
    i = 0,
    r = 0,
    s = !0,
    l;
  for (l of text) {
    if ('"' === l) {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (',' === l && s) l = row[++i] = '';
    else if ('\n' === l && s) {
      if ('\r' === p) row[i] = row[i].slice(0, -1);
      row = ret[++r] = [(l = '')];
      i = 0;
    } else row[i] += l;
    p = l;
  }
  return ret;
}

/**
 * Converts an alphabetical string to camel case.
 *
 * Modified slightly from the version found on Stack Overflow as posted by @CMS:
 * https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 *
 * @param {string} str The string to convert to camel case
 */
function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

if (!window.FileReader) {
  // Display an error message
} else {
  // Start the web application
  start();
}

/**
 * Generates a random number from 0 to `range` with a normal distribution.
 *
 * If `range` is undefined or less than 0, then the returned number will be in the range (0,1).
 *
 * Based on a Stack Overflow answer originally posted by @maxwell-coddard:
 * https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
 *
 * @param {number} range The maximum value in the range of numbers to generate.
 * @param {boolean} floor Indicates whether to floor the result using `Math.floor`
 *
 * @returns {number} The randomly generated number.
 */
function bmrand(range, floor = false) {
  if (!range || range < 0) range = 1;
  var u = 0;
  var v = 0;
  const rand = Math.random() * range;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  if (floor) {
    num = Math.floor(num);
  }
  return num;
}

/**
 * Generates a random number between 0 and `range` exclusive according to an approximately uniform distribution.
 *
 * @param {number} range The maximum value in the range of numbers to generate.
 * @param {boolean} floor Indicates whether to floor the result using `Math.floor`
 *
 * @returns {number} The randomly generated number.
 */
function urand(range = 0, floor = false) {
  let num = Math.random() * range;
  return floor ? Math.floor(num) : num;
}
