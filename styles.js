let _stylis = new stylis();

function style(selector, scss) {
  const eStyle = document.createElement('style');
  eStyle.innerText = _stylis(selector, scss);
  document.head.append(eStyle);
}

style(
  'body, html',
  `
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`
);

style(
  '.header',
  `
  background-color: #cccccc;
  text-align: center;
`
);

style(
  '.main',
  `
  `
);

style(
  '.container',
  `
  align-self: center;
  display: flex;
  flex-direction: column;
  margin: 0px;
  `
);

style(
  '.file-select-container',
  `
  display: flex;
  flex-direction: column;
  align-items: center;
  `
);

style(
  '.generator-container',
  `
  display: flex;
  flex-direction: column;
  align-items: center;
  `
);

style(
  '.controls',
  `
  display: flex;
  flex-direction: row;
  align-content: center;

  * {
    margin: 10px;
  }
  `
)

style(
  '#groups',
  `
  display: flex;
  flex-wrap: wrap;
`
);

style(
  '.group',
  `
  margin: 20px
`
);
