let no = 0;
const cloudUrl = 'https://djjjk9bjm164h.cloudfront.net/'
const data = [
  { img: `assets/members/Luca_bis.jpg`, name: 'LE GÉORGIEN ', age: '20', qg: 'Talence' },
  { img: `assets/members/Lola_bis.jpg`, name: 'LA SNIPEUSE', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/YoannM_bis.jpg`, name: 'LE SNIPER', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/Pierre_bis.jpg`, name: 'CAILLOU', age: '21', qg: 'Bordeaux' },
  { img: `assets/members/Clovis_bis.jpg`, name: 'ALL IN', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/YoannE_bis.jpg`, name: '2PAC', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/Aicha_bis.jpg`, name: 'CR7 2017-2019', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/Egshi_bis.jpg`, name: 'EGSHI', age: '20', qg: 'Pessac' },
  { img: `assets/members/Abdel_bis.jpg`, name: 'CLUTCH FACTOR', age: '21', qg: 'Pessac' },
  { img: `assets/members/Timeo_bis.jpg`, name: 'TRIPLE T', age: '20', qg: 'Pessac' },
  { img: `assets/members/Mourad_bis.jpg`, name: 'MOURADGOAT', age: '20', qg: 'Pessac' },
  { img: `assets/members/Thibault_bis.jpg`, name: 'LETHIBZ', age: '21', qg: 'Talence' },
  { img: `assets/members/Sekou_bis.jpg`, name: 'SK', age: '20', qg: 'Talence' },
  { img: `assets/members/Youssef_bis.jpg`, name: 'YOBOI', age: '20', qg: 'Pessac' },
  { img: `assets/members/Alexis_bis.jpg`, name: 'TITI', age: '20', qg: 'Pesasac' },
  { img: `assets/members/Adam_bis.jpg`, name: 'PRÉSIDENT DÉCHU', age: '21', qg: 'Pessac' },
  { img: `assets/members/Samuel_bis.jpeg`, name: 'SAM', age: '19', qg: 'Talence' },
  { img: `assets/members/Anya_bis.jpg`, name: 'TANA\'NYA', age: '20', qg: 'Bordeaux' },
  { img: `assets/members/Hugo_bis.jpg`, name: 'CALCULATRICE', age: '20', qg: 'Talence' },
  { img: `assets/members/Paul_bis.jpg`, name: 'LE TISMEY ULTIME', age: '20', qg: 'Talence' },
  { img: `assets/members/Nathan_bis.jpg`, name: 'GATOUZ', age: '20', qg: 'Talence' },
  { img: `assets/members/Armel_bis.jpg`, name: 'AJOURNÉ', age: '21', qg: 'Talence' },
  { img: `assets/members/Theophile_bis.jpg`, name: 'TOLEAF', age: '21', qg: 'Bordeaux' },
  { img: `assets/members/Jules_bis.jpg`, name: 'RESPO FORTNITE', age: '21', qg: 'Pessac' },
  { img: `assets/members/Alexandre_bis.jpg`, name: 'BURGER', age: '21', qg: 'Talence' },
  { img: `assets/members/Gabriel_bis.jpg`, name: 'SINGE', age: '20', qg: 'Pessac' },
  { img: `assets/members/Clarysse_bis.jpg`, name: 'CLACLOU', age: '20', qg: 'Talence' },
  { img: `assets/members/Irina_bis.jpg`, name: 'IRINA(SOA)', age: '20', qg: 'Pessac' },
  { img: `assets/members/Ange_bis.jpg`, name: 'DÉMON', age: '20', qg: 'Talence' }
]
const frame = document.body.querySelector('.frame')
data.forEach(_data => appendCard(_data))

let current = frame.querySelector('.card:last-child')
let likeText = current.children[0]
let startX = 0, startY = 0, moveX = 0, moveY = 0
initCard(current)

document.querySelector('#like').onclick = () => {
  moveX = 1
  moveY = 0
  complete()
}
document.querySelector('#hate').onclick = () => {
  moveX = -1
  moveY = 0
  complete()
}

function appendCard(data) {
  const firstCard = frame.children[0]
  const newCard = document.createElement('div')
  newCard.className = 'card'
  newCard.style.backgroundImage = `url(${data.img})`
  newCard.innerHTML = `
          <div class="is-like">LIKE</div>
          <div class="bottom">
            <div class="title">
              <span>${data.name}</span>
            </div>
            <div class="info">
              <span>${data.age}<b> ans</b></span>
              <span>sur le QG ${data.qg}</span>
            </div>
          </div>
        `
  if (firstCard) frame.insertBefore(newCard, firstCard)
  else frame.appendChild(newCard)
}

function initCard(card) {
  card.addEventListener('pointerdown', onPointerDown)
}

function setTransform(x, y, deg, duration) {
  current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${deg}deg)`
  likeText.style.opacity = Math.abs((x / innerWidth * 2.1))
  likeText.className = `is-like ${x > 0 ? 'like' : 'nope'}`
  if (duration) current.style.transition = `transform ${duration}ms`
}

function onPointerDown({ clientX, clientY }) {
  startX = clientX
  startY = clientY
  current.addEventListener('pointermove', onPointerMove)
  current.addEventListener('pointerup', onPointerUp)
  current.addEventListener('pointerleave', onPointerUp)
}

function onPointerMove({ clientX, clientY }) {
  moveX = clientX - startX
  moveY = clientY - startY
  setTransform(moveX, moveY, moveX / innerWidth * 50)
}

function onPointerUp() {
  current.removeEventListener('pointermove', onPointerMove)
  current.removeEventListener('pointerup', onPointerUp)
  current.removeEventListener('pointerleave', onPointerUp)
  if (Math.abs(moveX) > frame.clientWidth / 2) {
    current.removeEventListener('pointerdown', onPointerDown)
    complete()
  } else cancel()
}

function complete() {
  const flyX = (Math.abs(moveX) / moveX) * innerWidth * 1.3
  const flyY = (moveY / moveX) * flyX
  setTransform(flyX, flyY, flyX / innerWidth * 50, innerWidth)

  const prev = current
  const next = current.previousElementSibling
  if (next) initCard(next)
  current = next
  likeText = current.children[0]
  no = (no + 1) % data.length
  appendCard(data[no])
  setTimeout(() => frame.removeChild(prev), innerWidth)
}

function cancel() {
  setTransform(0, 0, 0, 100)
  setTimeout(() => current.style.transition = '', 100)
}