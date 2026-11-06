(function () {
  'use strict';

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toastTimer;

  function showToast(message) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function scrollToTarget(id) {
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function swapImage(img, src, alt) {
    if (!img) return;
    if (img.getAttribute('src') === src) {
      if (alt) img.alt = alt;
      return;
    }
    img.classList.add('swap');
    window.setTimeout(function () {
      img.src = src;
      if (alt) img.alt = alt;
      img.classList.remove('swap');
    }, reduceMotion ? 0 : 170);
  }

  function centerHorizontal(scroller, item) {
    if (!scroller || !item) return;
    var left = item.offsetLeft - (scroller.clientWidth - item.clientWidth) / 2;
    left = Math.max(0, Math.min(left, scroller.scrollWidth - scroller.clientWidth));
    if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      scroller.scrollLeft = left;
    }
  }

  // Cover particles
  var emberHost = $('#embers');
  if (emberHost) {
    var emberFragment = document.createDocumentFragment();
    for (var i = 0; i < 55; i += 1) {
      var particle = document.createElement('i');
      var isStar = i < 36;
      particle.className = isStar ? 'star' : 'ember';
      if (isStar) {
        particle.style.left = (Math.random() * 100).toFixed(2) + '%';
        particle.style.top = (Math.random() * 72).toFixed(2) + '%';
        particle.style.width = (Math.random() * 1.8 + 0.7).toFixed(2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = (Math.random() * 0.55 + 0.15).toFixed(2);
        particle.style.setProperty('--twinkle', (Math.random() * 4 + 2.5).toFixed(2) + 's');
        particle.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';
      } else {
        particle.style.left = (Math.random() * 100).toFixed(2) + '%';
        particle.style.width = (Math.random() * 2.3 + 1).toFixed(2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.setProperty('--dur', (Math.random() * 8 + 7).toFixed(2) + 's');
        particle.style.setProperty('--drift', (Math.random() * 90 - 45).toFixed(0) + 'px');
        particle.style.animationDelay = (-Math.random() * 10).toFixed(2) + 's';
      }
      emberFragment.appendChild(particle);
    }
    emberHost.appendChild(emberFragment);
  }

  var finaleStars = $('#finaleStars');
  if (finaleStars) {
    var starFragment = document.createDocumentFragment();
    for (var s = 0; s < 45; s += 1) {
      var star = document.createElement('i');
      star.className = 'star';
      star.style.left = (Math.random() * 100).toFixed(2) + '%';
      star.style.top = (Math.random() * 62).toFixed(2) + '%';
      var starSize = (Math.random() * 1.7 + 0.6).toFixed(2);
      star.style.width = starSize + 'px';
      star.style.height = starSize + 'px';
      star.style.opacity = (Math.random() * 0.45 + 0.12).toFixed(2);
      star.style.setProperty('--twinkle', (Math.random() * 5 + 3).toFixed(2) + 's');
      star.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's';
      starFragment.appendChild(star);
    }
    finaleStars.appendChild(starFragment);
  }

  // Global navigation
  $$('[data-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      closeDrawer();
      scrollToTarget(button.getAttribute('data-target'));
    });
  });

  var drawer = $('#chapterDrawer');
  var menuButton = $('#menuButton');
  function openDrawer() {
    if (!drawer || !menuButton) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');
    var close = $('.icon-close', drawer);
    if (close) window.setTimeout(function () { close.focus(); }, 220);
  }
  function closeDrawer() {
    if (!drawer || !menuButton || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
  }
  if (menuButton) {
    menuButton.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
  }
  $$('[data-close-drawer]').forEach(function (el) { el.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer();
  });

  // Chapter rail and active reading position
  var chapters = $$('.chapter, .cover');
  var chapterRail = $('#chapterRail');
  var chapterReadout = $('#chapterReadout');
  var activeChapterId = '';
  if (chapterRail) {
    chapters.forEach(function (chapter, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', chapter.getAttribute('data-label') || ('第' + index + '章'));
      button.innerHTML = '<span>' + (chapter.getAttribute('data-label') || '') + '</span>';
      button.addEventListener('click', function () { scrollToTarget(chapter.id); });
      chapterRail.appendChild(button);
    });
  }
  var railButtons = chapterRail ? $$('button', chapterRail) : [];
  var progress = $('#readProgress');
  var progressTicking = false;

  function updateReadingState() {
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (height > 0 ? Math.min(100, window.scrollY / height * 100) : 0) + '%';
    var marker = window.innerHeight * 0.42;
    var currentIndex = 0;
    var bestDistance = Infinity;
    chapters.forEach(function (chapter, index) {
      var rect = chapter.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom >= marker) {
        currentIndex = index;
        bestDistance = 0;
      } else if (bestDistance !== 0) {
        var distance = Math.min(Math.abs(rect.top - marker), Math.abs(rect.bottom - marker));
        if (distance < bestDistance) {
          bestDistance = distance;
          currentIndex = index;
        }
      }
    });
    var active = chapters[currentIndex];
    if (active && active.id !== activeChapterId) {
      activeChapterId = active.id;
      railButtons.forEach(function (button, index) {
        button.classList.toggle('is-on', index === currentIndex);
        button.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
      });
      if (chapterReadout) chapterReadout.textContent = active.getAttribute('data-label') || '';
    }
    progressTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!progressTicking) {
      window.requestAnimationFrame(updateReadingState);
      progressTicking = true;
    }
  }, { passive: true });
  updateReadingState();

  // Reveal content
  var revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-in'); });
  }

  // Chapter 01 · years
  var years = {
    '1934': {
      index: '01 / 03',
      month: '1934 · 秋',
      title: '告别中央苏区',
      text: '第五次反“围剿”失利后，中央红军主力于 1934 年 10 月从中央苏区出发，开始战略转移。于都河畔，成为许多人记忆里的起点。',
      quote: '“出发时，没有人知道这条路会有多长。”',
      image: 'assets/ch1-zunyi.jpg',
      alt: '遵义会议主题画作'
    },
    '1935': {
      index: '02 / 03',
      month: '1935 · 转折',
      title: '在转折中继续向前',
      text: '遵义会议在危急关头纠正错误军事路线，确立了毛泽东同志在党中央和红军的领导地位。随后，四渡赤水、巧渡金沙江，队伍在运动中争取主动。',
      quote: '“生死攸关的转折点，往往就藏在下一步选择里。”',
      image: 'assets/ch1-grassland.jpg',
      alt: '长征途中走出草地的画作'
    },
    '1936': {
      index: '03 / 03',
      month: '1936 · 会师',
      title: '火种在陕北汇聚',
      text: '1936 年 10 月，红军三大主力胜利会师，长征宣告胜利结束。跨越千山万水的队伍，在陕北重新汇聚成继续前行的力量。',
      quote: '“红旗落地，火种不灭。”',
      image: 'assets/ch1-victory.jpg',
      alt: '红军三大主力会师主题画作'
    }
  };
  var yearImage = $('#yearImage');
  var yearIndex = $('#yearIndex');
  var yearMonth = $('#yearMonth');
  var yearTitle = $('#yearTitle');
  var yearText = $('#yearText');
  var yearQuote = $('#yearQuote');
  $$('.year-tabs button').forEach(function (button) {
    button.addEventListener('click', function () {
      var year = years[button.getAttribute('data-year')];
      if (!year) return;
      $$('.year-tabs button').forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      swapImage(yearImage, year.image, year.alt);
      yearIndex.textContent = year.index;
      yearMonth.textContent = year.month;
      yearTitle.textContent = year.title;
      yearText.textContent = year.text;
      yearQuote.textContent = year.quote;
    });
  });

  // Torch
  var torchButton = $('#torchButton');
  if (torchButton) {
    torchButton.addEventListener('click', function () {
      var isLit = torchButton.getAttribute('aria-pressed') === 'true';
      torchButton.setAttribute('aria-pressed', isLit ? 'false' : 'true');
      if (isLit) {
        $('#torchTitle').textContent = '轻触，点亮一束火';
        $('#torchText').textContent = '历史已经远去，但精神仍有温度。点亮火炬，走向下一章。';
      } else {
        $('#torchTitle').textContent = '火种，仍在传递';
        $('#torchText').textContent = '光并不来自火炬本身，而来自后来的人一次次把它接过去。';
        showToast('长征精神，薪火相传');
      }
    });
  }

  // Chapter 02 · causes
  var causes = [
    {
      tag: '历史现场 · 1933—1934',
      title: '第五次反“围剿”失利',
      text: '1933 年下半年起，中央苏区在第五次反“围剿”中陷入被动。根据地空间不断被压缩，红军面临必须突围的严峻局面。',
      detail: '战略转移不是一次轻装的远行，而是在生存危机中寻找新的可能。',
      image: 'assets/ch1-grassland.jpg',
      alt: '长征途中行进的画作'
    },
    {
      tag: '历史现场 · 1934.10',
      title: '中央红军开始战略转移',
      text: '1934 年 10 月，中央红军主力离开中央苏区，开始长征。于都河、浮桥与送别的人群，构成许多人共同的出发记忆。',
      detail: '队伍带走了有限的物资，也带走了中国革命继续前进的希望。',
      image: 'assets/ch1-firelight.jpg',
      alt: '长征篝火夜话主题画作'
    },
    {
      tag: '历史现场 · 1935—1936',
      title: '转折之后，走向会师',
      text: '遵义会议、四渡赤水、强渡大渡河、飞夺泸定桥、翻雪山、过草地，一系列艰苦行军与重大转折，将不同方向的队伍带向陕北。',
      detail: '1936 年 10 月，红军三大主力胜利会师，长征宣告胜利结束。',
      image: 'assets/ch1-victory.jpg',
      alt: '红军三大主力会师主题画作'
    }
  ];
  var originImage = $('#originImage');
  $$('.origin-tabs button').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = Number(button.getAttribute('data-cause'));
      var cause = causes[index];
      if (!cause) return;
      $$('.origin-tabs button').forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      $('#originTag').textContent = cause.tag;
      $('#originIndex').textContent = '节点 0' + (index + 1) + ' / 03';
      $('#originTitle').textContent = cause.title;
      $('#originText').textContent = cause.text;
      $('#originDetail').textContent = cause.detail;
      swapImage(originImage, cause.image, cause.alt);
    });
  });

  // Chapter 03 · route data and interaction
  var routeNodesData = [
    {
      id: 'ruijin', x: 505, y: 625, label: '瑞金·于都', place: '瑞金 · 于都', time: '1934.10',
      title: '星火启程',
      lead: '中央红军主力 8.6 万余人从瑞金、于都集结渡河，战略转移开始。',
      text: '夜色里，于都河上的浮桥连起队伍的去路。出发的人群中，有年轻战士，也有机关人员和随军家属。那一刻，没有人知道前方是两万五千里的山河。',
      quote: '“他们走过的不只是路，是一个民族最难的拐点。”',
      image: 'assets/route-01-ruijin.jpg', alt: '瑞金出发历史图片'
    },
    {
      id: 'xiangjiang', x: 426, y: 572, label: '血战湘江', place: '广西 · 湘江', time: '1934.11—12',
      title: '湘江浴血',
      lead: '突破第四道封锁线，经过五昼夜激战，中央红军兵力从出发时的 8.6 万余人锐减至 3 万余人。',
      text: '湘江不是一条普通的地理界线，而是一道由火力与牺牲构成的封锁线。队伍付出了极其沉重的代价，才保存下继续前进的火种。',
      quote: '历史照片里的江面很静，静得让人记得那些没有渡过来的人。',
      image: 'assets/route-02-xiangjiang.jpg', alt: '血战湘江历史图片'
    },
    {
      id: 'zunyi', x: 354, y: 515, label: '遵义会议', place: '贵州 · 遵义', time: '1935.01',
      title: '生死转折',
      lead: '遵义会议在危急关头纠正错误军事路线，确立了毛泽东同志在党中央和红军的领导地位。',
      text: '这场会议挽救了党、挽救了红军、挽救了中国革命。它让队伍在连续受挫之后重新找到方向，也为接下来的机动与突围奠定了新的领导基础。',
      quote: '方向一旦清楚，再险的路也有了向前的意义。',
      image: 'assets/route-03-zunyi.jpg', alt: '遵义会议会址历史图片'
    },
    {
      id: 'chishui', x: 326, y: 599, label: '四渡赤水', place: '贵州 · 赤水河', time: '1935.01—03',
      title: '四渡赤水出奇兵',
      lead: '红军四次渡过赤水河，声东击西、灵活机动，在数十万敌军之间争取战略主动。',
      text: '同样的河流，四次往返。路线在地图上看似迂回，实则以时间换空间、以机动破合围。长征不是一条笔直的线，而是一连串在压力中作出的判断。',
      quote: '“没有路，就自己找路。”',
      image: 'assets/route-04-chishui.jpg', alt: '四渡赤水历史图片'
    },
    {
      id: 'jinsha', x: 257, y: 489, label: '巧渡金沙江', place: '云南 · 金沙江', time: '1935.05',
      title: '跳出包围圈',
      lead: '7 条木船，7 天 7 夜，红军主力渡过金沙江，把追兵甩在东岸。',
      text: '金沙江峡谷深切、水流湍急，渡江组织必须精确到每一只船、每一个时辰。队伍靠纪律与协作完成了转移，随后继续北上。',
      quote: '一条江把追兵留在身后，也把新的方向推到眼前。',
      image: 'assets/route-05-jinsha.jpg', alt: '巧渡金沙江历史图片'
    },
    {
      id: 'dadu', x: 234, y: 431, label: '强渡大渡河', place: '四川 · 安顺场', time: '1935.05.25',
      title: '孤舟突击',
      lead: '17 名勇士乘孤舟强渡安顺场，在密织的弹雨中为全军打开北上的通道。',
      text: '河面湍急，对岸火力封锁，一条小船就是一次把生死交给集体的选择。打开通道之后，更大的挑战仍在泸定桥方向等待着队伍。',
      quote: '真正的勇敢，不是不知道危险，而是知道危险仍然向前。',
      image: 'assets/route-06-dadu.jpg', alt: '强渡大渡河历史图片'
    },
    {
      id: 'luding', x: 201, y: 340, label: '飞夺泸定桥', place: '四川 · 泸定桥', time: '1935.05.29',
      title: '铁索惊雷',
      lead: '22 名勇士攀着悬空铁索，冒着火墙与枪弹夺取泸定桥。',
      text: '木板被抽走，桥只剩十三根铁索。对岸敌军纵火，桥头烈焰腾起。后来流传下来的，是勇士们一边攀索、一边叩响桥板的惊险身影。',
      quote: '铁索不会因为恐惧而变宽，路需要有人先走过去。',
      image: 'assets/route-07-luding.jpg', alt: '飞夺泸定桥历史图片'
    },
    {
      id: 'jiajin', x: 177, y: 281, label: '翻越夹金山', place: '四川 · 夹金山', time: '1935.06',
      title: '雪线之上',
      lead: '夹金山是红军长征翻越的第一座大雪山。空气稀薄、严寒缺氧，许多人倒下后再也没有站起来。',
      text: '雪山没有敌军，却以自然环境考验着每一个人。队伍在雪线上互相搀扶，把有限的体力留给旁边的战友，也把生的机会留给集体。',
      quote: '有些牺牲没有枪声，只有雪落下来。',
      image: 'assets/route-08-jiajin.jpg', alt: '翻越夹金山历史图片'
    },
    {
      id: 'caodi', x: 169, y: 252, label: '松潘草地', place: '四川 · 松潘草地', time: '1935.08',
      title: '穿越草地',
      lead: '沼泽、断粮与寒夜，使松潘草地成为长征中最艰苦的路段之一。',
      text: '草地表面像一片可以行走的原野，脚下却可能是吞人的泥沼。队伍靠草根、皮带与彼此支撑，在无人区里留下了继续北上的足迹。',
      quote: '看不见的陷阱，考验的是队伍最深的信任。',
      image: 'assets/route-09-caodi.jpg', alt: '松潘草地历史图片'
    },
    {
      id: 'lazikou', x: 135, y: 179, label: '激战腊子口', place: '甘肃 · 腊子口', time: '1935.09',
      title: '天险最后一关',
      lead: '红军以正面强攻与侧翼攀崖相配合，突破腊子口天险，打开进入陕甘的通道。',
      text: '绝壁夹着窄道，正面火力封锁严密。战士们从侧后攀上陡崖，出其不意发起攻击。突破之后，北上的道路终于逐渐清晰。',
      quote: '最后一关，往往最考验坚持。',
      image: 'assets/route-10-lazikou.jpg', alt: '激战腊子口历史图片'
    },
    {
      id: 'wuqi', x: 99, y: 146, label: '吴起镇', place: '陕西 · 吴起镇', time: '1935.10',
      title: '落脚陕北',
      lead: '1935 年 10 月，中央红军主力抵达陕北吴起镇，历时一年的战略转移告一段落。',
      text: '从于都河到吴起镇，队伍穿过了中国最深的山河。1936 年，红军三大主力胜利会师，长征胜利结束。地图上的红线收束了，但它留下的精神继续向前延伸。',
      quote: '队伍到达了终点，长征精神才刚刚开始新的出发。',
      image: 'assets/route-11-wuqi.jpg', alt: '吴起镇会师历史图片'
    }
  ];

  var routeNodesHost = $('#routeNodes');
  var routeSequence = $('#routeSequence');
  var currentRoute = 0;
  if (routeNodesHost && routeSequence) {
    routeNodesData.forEach(function (node, index) {
      var nodeButton = document.createElement('button');
      nodeButton.type = 'button';
      nodeButton.className = 'route-node';
      nodeButton.setAttribute('data-route-index', index);
      nodeButton.setAttribute('data-label', node.label);
      nodeButton.setAttribute('aria-label', (index + 1) + ' ' + node.place + '，' + node.time);
      nodeButton.style.left = (node.x / 600 * 100).toFixed(3) + '%';
      nodeButton.style.top = (node.y / 720 * 100).toFixed(3) + '%';
      nodeButton.addEventListener('click', function () { setRoute(index); });
      routeNodesHost.appendChild(nodeButton);

      var sequenceButton = document.createElement('button');
      sequenceButton.type = 'button';
      sequenceButton.setAttribute('data-route-index', index);
      sequenceButton.innerHTML = '<b>' + String(index + 1).padStart(2, '0') + '</b>' + node.label;
      sequenceButton.addEventListener('click', function () {
        setRoute(index);
        if (window.innerWidth < 700) {
          $('.route-story').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
      routeSequence.appendChild(sequenceButton);
    });
  }

  function setRoute(index) {
    if (!routeNodesData[index]) return;
    currentRoute = index;
    var node = routeNodesData[index];
    var routeImage = $('#routeImage');
    swapImage(routeImage, node.image, node.alt);
    $('#routeCounter').textContent = String(index + 1).padStart(2, '0') + ' / ' + routeNodesData.length;
    $('#routePlaceShort').textContent = node.place;
    $('#routeTime').textContent = node.time;
    $('#routeTitle').textContent = node.title;
    $('#routeLead').textContent = node.lead;
    $('#routeText').textContent = node.text;
    $('#routeQuote').textContent = node.quote;
    $('#routePathLive').style.strokeDashoffset = (100 - Math.max(6, index / (routeNodesData.length - 1) * 94)).toFixed(2);
    $$('.route-node').forEach(function (item, itemIndex) {
      item.classList.toggle('is-active', itemIndex === index);
      item.classList.toggle('is-visited', itemIndex <= index);
      item.setAttribute('aria-current', itemIndex === index ? 'true' : 'false');
    });
    $$('#routeSequence button').forEach(function (item, itemIndex) {
      item.classList.toggle('is-active', itemIndex === index);
    });
    $('#routePrev').disabled = index === 0;
    $('#routeNext').disabled = index === routeNodesData.length - 1;
    $('#routePrev').style.opacity = index === 0 ? '.35' : '1';
    $('#routeNext').style.opacity = index === routeNodesData.length - 1 ? '.35' : '1';
    centerHorizontal(routeSequence, $('#routeSequence button.is-active'));
  }
  $('#routePrev').addEventListener('click', function () { if (currentRoute > 0) setRoute(currentRoute - 1); });
  $('#routeNext').addEventListener('click', function () { if (currentRoute < routeNodesData.length - 1) setRoute(currentRoute + 1); });
  setRoute(0);

  // Chapter 04 · armies and unknown lights
  var armyData = [
    {
      name: '中央红军', start: '8.6万余', startAt: '1934.10 于都', end: '不足8000', endAt: '1935.10 吴起镇',
      note: '中央红军主力及中央、军委机关共 8.6 万余人从于都河以北地区集结出发。湘江战役后减至 3 万余人，1935 年 10 月抵达陕北吴起镇时仅 7000 余人。',
      image: 'assets/soldiers-four.jpg', alt: '四名红军战士历史合影'
    },
    {
      name: '红二十五军', start: '2980余', startAt: '1934.11 何家冲', end: '约3400', endAt: '1935.9 永坪镇会师',
      note: '红二十五军以“中国工农红军北上抗日第二先遣队”名义从河南罗山何家冲出发，1935 年 9 月率先抵达陕北。人数增加源于沿途扩红与补充，并非没有减员。',
      image: 'assets/soldiers-red25.jpg', alt: '红二十五军部分指战员合影'
    },
    {
      name: '红四方面军', start: '8万余', startAt: '1935.5 川陕苏区', end: '近3.8万', endAt: '1936.10 会宁会师',
      note: '1935 年 5 月撤离川陕苏区向西转移，1936 年 10 月到达甘肃会宁与红一方面军会师。部队曾三过草地，行程约一万里。',
      image: 'assets/soldiers-march.jpg', alt: '红军行军历史照片'
    },
    {
      name: '红二、红六军团', start: '1.7万余', startAt: '1935.11 桑植', end: '约1.3万', endAt: '1936.7 整编为红二方面军',
      note: '1935 年 11 月由湖南桑植刘家坪等地出发，1936 年 7 月与红四方面军会师后整编为红二方面军，10 月与红一方面军会师。',
      image: 'assets/soldier-yudu.png', alt: '于都籍红军战士历史合影'
    }
  ];
  var armyTabs = $('#armyTabs');
  if (armyTabs) {
    armyData.forEach(function (army, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = army.name;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      if (index === 0) button.classList.add('is-active');
      button.addEventListener('click', function () {
        $$('#armyTabs button').forEach(function (item, itemIndex) {
          var active = itemIndex === index;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        $('#armyIndex').textContent = '档案 0' + (index + 1) + ' / 04';
        $('#armyName').textContent = army.name;
        $('#armyStart').textContent = army.start;
        $('#armyStartAt').textContent = army.startAt;
        $('#armyEnd').textContent = army.end;
        $('#armyEndAt').textContent = army.endAt;
        $('#armyNote').textContent = army.note;
        swapImage($('#armyPhoto'), army.image, army.alt);
      });
      armyTabs.appendChild(button);
    });
  }

  var dotField = $('#dotField');
  if (dotField) {
    for (var d = 0; d < 84; d += 1) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', '点亮第 ' + (d + 1) + ' 束微光');
      dot.addEventListener('click', function (event) {
        event.currentTarget.classList.add('is-lit');
      });
      dotField.appendChild(dot);
    }
  }
  var lightUnknown = $('#lightUnknown');
  if (lightUnknown && dotField) {
    lightUnknown.addEventListener('click', function () {
      var dots = $$('button', dotField);
      var unlit = dots.filter(function (item) { return !item.classList.contains('is-lit'); });
      if (!unlit.length) {
        dots.forEach(function (item) { item.classList.remove('is-lit', 'is-chosen'); });
        unlit = dots;
      }
      $$('.is-chosen', dotField).forEach(function (item) { item.classList.remove('is-chosen'); });
      var chosen = unlit[Math.floor(Math.random() * unlit.length)];
      chosen.classList.add('is-lit', 'is-chosen');
      showToast('你点亮的那一个，没有留下名字');
    });
  }

  var ageRange = $('#ageRange');
  if (ageRange) {
    ageRange.addEventListener('input', function () {
      var age = Number(ageRange.value);
      var note = '';
      if (age <= 18) note = age + ' 岁：14—18 岁战士至少占 40%，这正是长征队伍里最常见的一群年轻人。';
      else if (age < 20) note = age + ' 岁：已经接近战斗员“平均不足 20 岁”的年龄。';
      else if (age < 25) note = age + ' 岁：比许多红军战斗员年长，也接近不少指挥员的平均年龄。';
      else if (age === 25) note = '25 岁：指挥员平均年龄“不足 25 岁”，这个年龄已经超过多数指挥员的平均值。';
      else note = age + ' 岁：在当年，这个年纪已经比队伍中大多数战士和指挥员都更年长。';
      $('#ageValue').textContent = age;
      $('#ageNote').textContent = note;
    });
  }

  // Chapter 05 · women
  var womenData = [
    {
      name: '康克清', kicker: '翻越 · 三次雪山', action: '三次翻越雪山', verb: '越',
      title: '她把雪山，当成一段路',
      quote: '“就像在野外散步一样。” —— 康克清回忆长征',
      summary: '作为直属队指导员，她随红军三大主力行动，三次翻越雪山，走完整整两年的长征。别人眼中的极限，被她轻声说成“散步”。',
      story: '康克清出生于江西省万安县罗塘湾的一个贫苦渔家。队伍翻雪山时，她不是被照顾的对象，而是直属队指导员。她随红军三大主力行动，走完长征全过程，三次翻越雪山，历时整整两年，比红一方面军其他女红军多走了一年。后来她回忆长征，却说“就像在野外散步一样”。一句轻描淡写，背后是整整两年的枪林弹雨与雪山草地。',
      scene: 'assets/woman-kang.webp', sceneAlt: '康克清翻越雪山AI情景再现',
      portrait: 'assets/portrait-kang.webp', portraitAlt: '康克清历史照片'
    },
    {
      name: '贺子珍', kicker: '守护 · 1935 贵州盘县', action: '身中 17 块弹片', verb: '护',
      title: '敌机俯冲时，她扑向伤员',
      quote: '17 块弹片进入身体，其中一些伴随她一生。',
      summary: '敌机突然轰炸时，她没有先找掩体，而是扑在伤员身上。醒来后，她先问的仍是伤员的情况。',
      story: '贺子珍出生于江西省永新县烟阁乡黄竹岭村。1935 年，在贵州盘县，敌机突然轰炸。贺子珍没有先找掩体，而是扑在伤员身上掩护，身中 17 块弹片，脑颅里残留的弹片伴随她一生。她醒来后先问伤员情况，还嘱咐不要把自己受伤的消息告诉毛泽东。这不是电影桥段，而是长征路上一位女战士的本能选择。',
      scene: 'assets/woman-he.webp', sceneAlt: '贺子珍救助伤员AI情景再现',
      portrait: 'assets/portrait-he.webp', portraitAlt: '贺子珍历史照片'
    },
    {
      name: '邓颖超', kicker: '脱困 · 茫茫草地', action: '带病穿越草地', verb: '渡',
      title: '躺在担架上，也要走出草地',
      quote: '别人是走长征，她是一边与病魔搏斗、一边完成长征。',
      summary: '出发前，她已患肺结核。过草地第一天，她连人带马陷进沼泽；当晚高烧腹泻，又躺在担架上穿越了茫茫草地。',
      story: '邓颖超出生于河南光山。长征出发前，她已患肺结核，大口吐血、高烧体弱。过草地第一天，她连人带马陷进沼泽，靠顽强意志坚持到后续人马赶来才被拉出。当晚高烧腹泻，她躺在担架上穿越了茫茫草地。别人是走长征，她是一边与病魔搏斗、一边完成长征。',
      scene: 'assets/woman-deng.webp', sceneAlt: '邓颖超病中过草地AI情景再现',
      portrait: 'assets/portrait-deng.webp', portraitAlt: '邓颖超历史照片'
    },
    {
      name: '危拱之', kicker: '行走 · 一双“解放脚”', action: '花鼓声鼓舞队伍', verb: '走',
      title: '一双“解放脚”，走完二万五千里',
      quote: '长征路上，歌声也是战斗力。',
      summary: '她缠过足，却全程徒步走完二万五千里。行军途中，她编唱新《凤阳花鼓》，战士们一听“唱花鼓戏的同志在前面”，脚步便快了起来。',
      story: '危拱之出生在信阳城里一个破落的书香门第，1926 年考入黄埔军校武汉分校，1927 年 4 月加入中国共产党。她缠过足，却有一双“解放脚”，全程徒步走完二万五千里，是中央红军 32 名全程走完长征的女战士之一。行军途中她坚持表演，编唱新《凤阳花鼓》名扬全军。战士们一听“唱花鼓戏的同志在前面”，脚步都快了起来。',
      scene: 'assets/woman-wei.webp', sceneAlt: '危拱之唱花鼓鼓舞队伍AI情景再现',
      portrait: 'assets/portrait-wei.webp', portraitAlt: '危拱之历史照片'
    },
    {
      name: '李坚真', kicker: '护送 · 担架与药箱', action: '抬着战友、护着药箱', verb: '抬',
      title: '她抬起的是担架，也是生的方向',
      quote: '她的长征，是抬着战友、护着药箱走过来的。',
      summary: '民夫跑了，她和战士抬起担架冲出火线；快到泸定桥时，她又把药箱紧紧绑在肩上，扶着铁索一步步走过桥。',
      story: '李坚真是广东丰顺人，1926 年参加革命，1927 年加入中国共产党，被誉为“客家女杰”。长征途中一次队伍遭袭，抬担架的民夫跑了。干部休养连指导员李坚真和一名战士抬起担架就跑，在敌人射击下一路冲进深沟，放下担架时肩膀已磨得红肿。快到泸定桥时，她把药箱紧紧绑在肩上，扶着铁索一步步走过去。她的长征，是抬着战友、护着药箱走过来的。',
      scene: 'assets/woman-li.webp', sceneAlt: '李坚真护送担架与药箱AI情景再现',
      portrait: 'assets/portrait-li.webp', portraitAlt: '李坚真历史照片'
    },
    {
      name: '蔡畅', kicker: '歌唱 · 长征“精神食粮”', action: '用歌声凝聚队伍', verb: '唱',
      title: '在最难走的路上，把歌声留在队前',
      quote: '“歌声和讲述，是长征中的精神食粮。” —— 康克清回忆蔡畅',
      summary: '她是长征女红军中年龄最大的一位，却常应战士要求高唱《国际歌》《马赛曲》。在最艰苦的路上，她用歌声把队伍重新拧成一股绳。',
      story: '蔡畅是湖南湘乡人，也是长征女红军中年龄最大的一位，却常应战士要求高唱《国际歌》《马赛曲》。遇到周恩来、邓小平、聂荣臻等留法战友时，大家一齐用法语歌唱。康克清把她的歌声和讲述称为长征中的“精神食粮”。在最艰苦的行军路上，她用歌声把队伍重新拧成一股绳。',
      scene: 'assets/woman-cai.webp', sceneAlt: '蔡畅在山间带队高唱国际歌AI情景再现',
      portrait: 'assets/portrait-cai.webp', portraitAlt: '蔡畅历史照片'
    }
  ];
  var womenTabs = $('#womenTabs');
  var currentWoman = 0;
  if (womenTabs) {
    womenData.forEach(function (woman, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      if (index === 0) button.classList.add('is-active');
      button.innerHTML = '<img src="' + woman.portrait + '" alt=""><span><b>' + woman.name + '</b><small>' + woman.action + '</small></span>';
      button.addEventListener('click', function () { setWoman(index); });
      womenTabs.appendChild(button);
    });
  }
  function setWoman(index) {
    if (!womenData[index]) return;
    currentWoman = index;
    var woman = womenData[index];
    $$('#womenTabs button').forEach(function (button, itemIndex) {
      var active = itemIndex === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    swapImage($('#womanScene'), woman.scene, woman.sceneAlt);
    swapImage($('#womanPortrait'), woman.portrait, woman.portraitAlt);
    $('#womanVerb').textContent = woman.verb;
    $('#womanIndex').textContent = '人物档案 ' + String(index + 1).padStart(2, '0') + ' / 06';
    $('#womanAction').textContent = woman.action;
    $('#womanTitle').textContent = woman.title;
    $('#womanQuote').textContent = woman.quote;
    $('#womanSummary').textContent = woman.summary;
    $('#womanStory').textContent = woman.story;
    $('#womanDots').textContent = String(index + 1).padStart(2, '0') + ' / 06';
    var details = $('.woman-copy details');
    if (details) details.open = false;
    centerHorizontal(womenTabs, $('#womenTabs button.is-active'));
  }
  $('#womanPrev').addEventListener('click', function () {
    setWoman((currentWoman - 1 + womenData.length) % womenData.length);
  });
  $('#womanNext').addEventListener('click', function () {
    setWoman((currentWoman + 1) % womenData.length);
  });
  var womenStage = $('.women-stage');
  var touchStartX = 0;
  if (womenStage) {
    womenStage.addEventListener('touchstart', function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    womenStage.addEventListener('touchend', function (event) {
      var delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 55) {
        setWoman((currentWoman + (delta < 0 ? 1 : -1) + womenData.length) % womenData.length);
      }
    }, { passive: true });
  }
  setWoman(0);

  // Chapter 06 · spirit cards, comparison and Wuhan voices
  var spiritCards = [
    { word: '理想信念', image: 'assets/ch1-firelight.jpg', line: '知道为什么出发，就不会倒在半路。' },
    { word: '不怕牺牲', image: 'assets/modern-wuhan.jpg', line: '把“不可能”，一步一步走成“能”。' },
    { word: '实事求是', image: 'assets/saihanba-before.jpg', line: '没有路，就靠调查与判断自己找路。' },
    { word: '团结守纪', image: 'assets/soldiers-march.jpg', line: '一个人可以走得快，一群人才能走得远。' },
    { word: '依靠人民', image: 'assets/ch1-people.jpg', line: '长征的补给线不在仓库里，在人心里。' }
  ];
  var spiritDeck = $('#spiritDeck');
  if (spiritDeck) {
    spiritCards.forEach(function (card, index) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'spirit-card';
      item.innerHTML = '<img src="' + card.image + '" alt=""><span class="spirit-card__num">0' + (index + 1) + '</span>' +
        '<span class="spirit-card__copy"><small>THE SPIRIT</small><h3>' + card.word + '</h3><p>' + card.line + '</p></span>';
      item.addEventListener('click', function () {
        var wasOpen = item.classList.contains('is-open');
        $$('.spirit-card', spiritDeck).forEach(function (other) { other.classList.remove('is-open'); });
        if (!wasOpen) item.classList.add('is-open');
      });
      spiritDeck.appendChild(item);
    });
    $('.spirit-card', spiritDeck).classList.add('is-open');
  }

  var compareRange = $('#compareRange');
  var compareVisual = $('#compareVisual');
  if (compareRange && compareVisual) {
    var setCompare = function (value) {
      compareVisual.style.setProperty('--split', value + '%');
    };
    compareRange.addEventListener('input', function () { setCompare(compareRange.value); });
    setCompare(compareRange.value);
  }

  var wuhanPeople = [
    {
      name: '钟南山', image: 'assets/modern-person-1.jpg',
      quote: '“肯定存在人传人。”',
      story: '84 岁的钟南山在高铁餐车角落闭眼休息。几天后，他在镜头前说出“人传人”三个字。一个人面对巨大不确定性时，把真话说出来，本身就是重量。'
    },
    {
      name: '张定宇', image: 'assets/modern-person-2.jpg',
      quote: '“我必须‘跑’得更快，才能跑赢时间。”',
      story: '他的双腿正在萎缩，妻子感染后被隔离在另一家医院。他每天在病区里小跑着协调床位、抢运物资，用一副正在冻结的身体，去追一个不断加速的病毒。'
    },
    {
      name: '张伯礼', image: 'assets/modern-person-3.jpg',
      quote: '“国有危难时，医生即战士。”',
      story: '72 岁的张伯礼在武汉奋战 82 天。胆囊摘除手术后的第三天，他便出现在视频会议上。这句话不是口号，而是一位老人在危难时刻给自己下的命令。'
    }
  ];
  var wuhanTabs = $('#wuhanTabs');
  if (wuhanTabs) {
    wuhanPeople.forEach(function (person, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = person.name;
      if (index === 0) button.classList.add('is-active');
      button.addEventListener('click', function () {
        $$('#wuhanTabs button').forEach(function (item, itemIndex) {
          item.classList.toggle('is-active', itemIndex === index);
        });
        swapImage($('#wuhanImage'), person.image, person.name);
        $('#wuhanQuote').textContent = person.quote;
        $('#wuhanStory').textContent = person.story;
      });
      wuhanTabs.appendChild(button);
    });
  }

  // Chapter 07 · video, keywords, quiz
  var video = $('#legacyVideo');
  var filmCover = $('#filmCover');
  var filmToggle = $('#filmToggle');
  var filmReplay = $('#filmReplay');
  var filmTime = $('#filmTime');
  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function toggleFilm() {
    if (!video) return;
    if (video.paused) {
      video.play().then(function () {
        if (filmCover) filmCover.classList.add('is-hidden');
        if (filmToggle) filmToggle.textContent = 'Ⅱ 暂停';
      }).catch(function () { showToast('请再次点击播放'); });
    } else {
      video.pause();
      if (filmToggle) filmToggle.textContent = '▶ 播放';
    }
  }
  if (filmCover) filmCover.addEventListener('click', toggleFilm);
  if (filmToggle) filmToggle.addEventListener('click', toggleFilm);
  if (filmReplay && video) {
    filmReplay.addEventListener('click', function () {
      video.currentTime = 0;
      video.play().then(function () {
        if (filmCover) filmCover.classList.add('is-hidden');
        if (filmToggle) filmToggle.textContent = 'Ⅱ 暂停';
      }).catch(function () { showToast('请再次点击播放'); });
    });
  }
  if (video) {
    video.addEventListener('timeupdate', function () {
      if (filmTime) filmTime.textContent = formatTime(video.currentTime);
    });
    video.addEventListener('ended', function () {
      if (filmCover) filmCover.classList.remove('is-hidden');
      if (filmToggle) filmToggle.textContent = '▶ 播放';
    });
    video.addEventListener('pause', function () {
      if (filmToggle) filmToggle.textContent = '▶ 播放';
    });
    video.addEventListener('play', function () {
      if (filmToggle) filmToggle.textContent = 'Ⅱ 暂停';
    });
  }

  var spiritWordsData = [
    ['01', '理想信念', '在最饿、最冷、最看不到尽头时，仍然相信脚下的路通向值得的地方。'],
    ['02', '不怕牺牲', '清楚地知道代价，仍然把脚放到下一步。'],
    ['03', '实事求是', '在没有答案的地方，靠调查、判断和不断纠错找到路。'],
    ['04', '团结守纪', '每个人愿意为旁边的人慢半步、让一步、扶一把。'],
    ['05', '依靠人民', '草鞋、粮食、一条船、一句带路的话，都是信任。']
  ];
  var spiritWords = $('#spiritWords');
  if (spiritWords) {
    spiritWordsData.forEach(function (item) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'spirit-word';
      card.innerHTML = '<small>' + item[0] + '</small><b>' + item[1] + '</b><span>' + item[2] + '</span>';
      card.addEventListener('click', function () {
        var wasOpen = card.classList.contains('is-open');
        $$('.spirit-word').forEach(function (other) { other.classList.remove('is-open'); });
        if (!wasOpen) card.classList.add('is-open');
      });
      spiritWords.appendChild(card);
    });
  }

  $$('#quizCard [data-answer]').forEach(function (button) {
    button.addEventListener('click', function () {
      var correct = button.getAttribute('data-answer') === 'right';
      button.classList.add(correct ? 'is-right' : 'is-wrong');
      if (!correct) {
        var answer = $('#quizCard [data-answer="right"]');
        if (answer) answer.classList.add('is-right');
        showToast('再想一想：三大主力会师发生在 1936 年 10 月');
      } else {
        showToast('回答正确：1936 年 10 月，三大主力胜利会师');
      }
      $('#quizExplain').classList.add('is-visible');
    });
  });

  // Chapter 08 · pledge, word and message wall
  var pledges = {
    '学生': '在我的长征里，把每一次认真坚持，变成走向未来的一小步。',
    '教师': '在我的长征里，把知识与信念传给下一代，让火种继续亮着。',
    '基层工作者': '在我的长征里，把每一件群众的难事，当成为人民走的一里路。',
    '科研人员': '在我的长征里，在没有答案的地方多问一次，在看不见结果时多做一天。',
    '军人': '在我的长征里，守住使命与责任，在需要的时候向前一步。'
  };
  var roleTabs = $('#roleTabs');
  if (roleTabs) {
    Object.keys(pledges).forEach(function (role, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = role;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      if (index === 0) button.classList.add('is-active');
      button.addEventListener('click', function () {
        $$('#roleTabs button').forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        $('#pledgeRole').textContent = role;
        $('#pledgeText').textContent = pledges[role];
      });
      roleTabs.appendChild(button);
    });
  }
  var copyPledge = $('#copyPledge');
  if (copyPledge) {
    copyPledge.addEventListener('click', function () {
      var text = $('#pledgeRole').textContent + '：' + $('#pledgeText').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('宣言已复制');
        }).catch(function () {
          showToast('请长按宣言文字复制');
        });
      } else {
        showToast('请长按宣言文字复制');
      }
    });
  }

  var wordSentences = {
    '坚持': '把一件难而正确的事，多做一天。',
    '较真': '在没有人看见的地方，也守住自己的标准。',
    '不撤': '面对一个想放弃的时刻，再往前走一步。',
    '守住': '守住岗位、守住承诺，也守住心里那一点光。'
  };
  $$('#wordOptions button').forEach(function (button) {
    button.addEventListener('click', function () {
      $$('#wordOptions button').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      var word = button.textContent.trim();
      $('#chosenWord').textContent = word;
      $('#wordSentence').textContent = wordSentences[word] || '';
    });
  });
  var firstWord = $('#wordOptions button');
  if (firstWord) firstWord.classList.add('is-active');

  var messageForm = $('#messageForm');
  var messageStream = $('#messageStream');
  var storageKey = 'long-march-h5-messages-v1';
  var seedMessages = [
    { name: '一位同学', text: '把今天该做的事认真做完，就是我的长征。' },
    { name: '接力者', text: '不忘来路，才能走好前路。' },
    { name: '无名者', text: '在自己的岗位上，守住初心，向前一步。' }
  ];
  function getMessages() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }
  function saveMessages(messages) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-8)));
    } catch (error) {
      // Local storage may be unavailable in private or file contexts.
    }
  }
  function renderMessages() {
    if (!messageStream) return;
    messageStream.textContent = '';
    var messages = getMessages();
    if (!messages.length) messages = seedMessages;
    messages.slice().reverse().forEach(function (message) {
      var item = document.createElement('article');
      item.className = 'message-item';
      var copy = document.createElement('p');
      copy.textContent = message.text;
      var signature = document.createElement('span');
      signature.textContent = '—— ' + (message.name || '接力者');
      item.appendChild(copy);
      item.appendChild(signature);
      messageStream.appendChild(item);
    });
  }
  if (messageForm) {
    messageForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameInput = $('#messageName');
      var textInput = $('#messageText');
      var text = textInput.value.trim();
      if (!text) return;
      var messages = getMessages();
      messages.push({ name: nameInput.value.trim() || '接力者', text: text });
      saveMessages(messages);
      messageForm.reset();
      renderMessages();
      showToast('你的寄语已加入薪火接力墙');
    });
  }
  renderMessages();

  // Deep link support and sensible initial state
  if (window.location.hash) {
    var hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      window.setTimeout(function () { hashTarget.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 80);
    }
  }
  window.addEventListener('hashchange', function () {
    var hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) hashTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
})();
