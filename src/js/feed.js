const shareImageButton = document.querySelector('#share-image-button')
const createPostArea = document.querySelector('#create-post')
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)
const sharedMomentsArea = document.querySelector('#shared-moments')
const form = document.forms.create_post

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

;(async () => {
  const url =
    'https://firestore.googleapis.com/v1beta1/projects/pwa-gram-358d7/databases/(default)/documents/posts'
  try {
    const data = await (await fetch(url)).json()
    console.log('from web', data)
    clearCards()
    data.documents.forEach(post => {
      const id = post.name.split('/').pop()

      const newCard = {
        id,
        title: post.fields.title.stringValue,
        location: post.fields.location.stringValue,
        image: post.fields.image.stringValue,
      }
      createCard(newCard)
    })
  } catch (e) {
    console.log('NO WORRIES 👌', e)

    const data = await readAllData('posts')
    console.log('From cache', data)
    clearCards()
    data.forEach(post => createCard(post))
  }
})()

form.addEventListener('submit', async e => {
  e.preventDefault()
  if (!form.title.value.trim() || !form.location.value.trim()) return
  const newPost = {
    title: form.title.value,
    location: form.location.value,
  }
  console.log(newPost)
  closeCreatePostModal()

  if ('SyncManager' in window) {
    const sw = await navigator.serviceWorker.ready
    sw.sync.register('')
  }
})
