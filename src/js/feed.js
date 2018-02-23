var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)
var sharedMomentsArea = document.querySelector('#shared-moments')

function openCreatePostModal() {
  createPostArea.style.display = 'block'
  if (deferredPrompt) {
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome)

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('User added to home screen')
      }
    })

    deferredPrompt = null
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)

// async function onSaveButtonClicked() {
//   const cache = await caches.open('user-requested')
//   cache.add('https://httpbin.org/get')
//   cache.add('/src/images/sf-boat.jpg')
// }

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function updateUI(data) {
  clearCards()
  for (var i = 0; i < data.length; i++) {
    createCard(data[i])
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div')
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp'
  var cardTitle = document.createElement('div')
  cardTitle.className = 'mdl-card__title'
  cardTitle.style.backgroundImage = 'url(' + data.image + ')'
  cardTitle.style.backgroundSize = 'cover'
  cardTitle.style.height = '180px'
  cardWrapper.appendChild(cardTitle)
  var cardTitleTextElement = document.createElement('h2')
  cardTitleTextElement.style.color = 'white'
  cardTitleTextElement.className = 'mdl-card__title-text'
  cardTitleTextElement.textContent = data.title
  cardTitle.appendChild(cardTitleTextElement)
  var cardSupportingText = document.createElement('div')
  cardSupportingText.className = 'mdl-card__supporting-text'
  cardSupportingText.textContent = data.location
  cardSupportingText.style.textAlign = 'center'
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText)
  componentHandler.upgradeElement(cardWrapper)
  sharedMomentsArea.appendChild(cardWrapper)
}

async function checkNetwork() {
  const url = 'https://vue-axios-b1caa.firebaseio.com/posts.json'
  try {
    const data = await (await fetch(url)).json()
    console.log('from web', data)
    /*     const dataArray = Object.keys(data).map(id => ({
      id,
      ...data[id],
    })) */
    const dataArray = []
    for (let key in data) {
      dataArray.push(data[key])
    }

    clearCards()
    updateUI(dataArray)
  } catch (e) {
    console.log(e)
    const res = await caches.match(url)
    if (res) {
      const data = await res.json()
      console.log('From cache', data)
      const dataArray = []
      for (let key in data) {
        dataArray.push(data[key])
      }
      updateUI(dataArray)
    }
  }
}
checkNetwork()
