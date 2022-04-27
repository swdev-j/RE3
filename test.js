const axios = require("axios");

const getHtml = async (text) => {
  try {
    return await axios.get("https://spocjaxkrk.execute-api.ap-northeast-2.amazonaws.com/v1/detect?comment="+encodeURIComponent(text));
  } catch (error) {
    console.error(error);
  }
};

getHtml('시발')
  .then(html => console.log(Object.values(html.data).reduce((a, b) => a + b)))
  .catch(err => console.log(err))