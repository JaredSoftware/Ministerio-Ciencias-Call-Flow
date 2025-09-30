const path = require("path"),
  fs = require("fs"),
  ejs = require("ejs");

/**
 *
 * @param {string} viewPath p.ej.: teemplatee_partials/menu.ejs
 * @param {*} data
 */

function renderPartial(viewPath, data) {
  try {
    const _view = fs
      .readFileSync(process.cwd() + "/views" + viewPath)
      .toString();
    return ejs.render(_view, data);
  } catch (error) {
    return `
            <p style="color:red; border: 1px solid red; padding: 5px; background-color: rgba(255, 236, 235, 0.75)">
                Error: renderizando ${viewPath} -> ${error.message}
            </p>
        `;
  }
}

module.exports = {
  renderPartial,
};
