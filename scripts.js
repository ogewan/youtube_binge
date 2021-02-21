
/**
 * Sample JavaScript code for youtube.videos.list
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/guides/code_samples#javascript
 */
let loadedClient = false;
const data = JSON.parse(localStorage.getItem('ytb-data')) || {};
const select = document.getElementById('options');
const view = document.getElementById('view');
select.onchange = () => {
  const video = JSON.parse(select.value);
  // view.src = `https://www.youtube.com/watch?v=${video.id}`;
  view.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
};

function authenticate() {
  return gapi.auth2.getAuthInstance()
      .signIn({scope: 'https://www.googleapis.com/auth/youtube.readonly'})
      .then(
          function() {
            console.log('Sign-in successful');
          },
          function(err) {
            console.error('Error signing in', err);
          });
}
async function loadClient() {
  gapi.client.setApiKey(api_key);
  return await gapi.client
      .load('https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest')
      .then(
          function() {
            console.log('GAPI client loaded for API');
          },
          function(err) {
            console.error('Error loading GAPI client for API', err);
          });
}
async function execute(video_ids) {
  if (!loadedClient) {
    await loadClient();
  }
  return gapi.client.youtube.videos
      .list({'part': ['snippet'], 'id': [video_ids.join(',')]})
      .then(
          function(response) {
            // Handle the results here (response.result has the parsed body).
            console.log('Response', response);
            return response.result;
          },
          function(err) {
            console.error('Execute error', err);
          });
}
function collect(result) {
  return result.items;
}
async function batch(callback, args, aggregator, limit = 50) {
  let data = [];
  while (args.length) {
    const results = aggregator(await callback(args.splice(0, limit)));
    data = data.concat(results);
  }
  return data;
}
function retrieveVideoId(raw_url) {
  try {
    const url = new URL(raw_url);
    const params = new URLSearchParams(url.search);
    return params.get('v');
  } catch {
    return null;
  }
}
async function processLinks() {
  const field = document.getElementById('entry');
  const links = field.value.split(/(\s+)/);
  const ids = links.map(retrieveVideoId).filter(v => v).filter(v => !data[v]);
  field.value = '';

  const vids = await batch(execute, ids, collect);
  vids.forEach(v => data[v.id] = v);
  localStorage.setItem('ytb-data', JSON.stringify(data));
  updateOptions();
}
function makeOption(video) {
  const option = document.createElement('option');
  option.innerText = video.snippet.title;
  option.value = JSON.stringify(video);
  return option;
}
function updateOptions() {
  const field = document.getElementById('options');
  // TODO: rebuilding everytime is not optimal
  field.innerHTML = '';
  field.append(document.createElement('option'));
  const options = Object.values(data).map(makeOption);
  field.append(...options);
}

gapi.load('client:auth2', function() {
  gapi.auth2.init({client_id});
});
updateOptions();