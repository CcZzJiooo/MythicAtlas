import { DestinationItem } from '../types';
import { getBeastSvgIcon } from './MythicBeastIcons';

export class DailyScenicStage {
  private element: HTMLElement;
  private currentDest: DestinationItem;
  private onStampClick: (cityId: string) => void;
  private onSaveNote: (cityId: string, note: string) => void;
  private activeHeroImage: string;
  private isStamped = false;
  private savedNote = '';

  constructor(
    currentDest: DestinationItem,
    isStamped: boolean,
    savedNote: string,
    onStampClick: (cityId: string) => void,
    onSaveNote: (cityId: string, note: string) => void
  ) {
    this.currentDest = currentDest;
    this.activeHeroImage = currentDest.heroImage;
    this.isStamped = isStamped;
    this.savedNote = savedNote;
    this.onStampClick = onStampClick;
    this.onSaveNote = onSaveNote;

    this.element = document.createElement('section');
    this.element.id = 'daily-stage';
    this.element.className = 'daily-scenic-stage';
    this.render();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateDestination(dest: DestinationItem, isStamped: boolean, note: string) {
    this.currentDest = dest;
    this.activeHeroImage = dest.heroImage;
    this.isStamped = isStamped;
    this.savedNote = note;
    this.render();
  }

  public setStamped(stamped: boolean) {
    this.isStamped = stamped;
    const stampBtn = this.element.querySelector('#stamp-action-btn');
    const sealVisual = this.element.querySelector('#daily-seal-stamp');
    if (stampBtn && sealVisual) {
      if (stamped) {
        stampBtn.innerHTML = '✨ 岁月铭刻 · 已钤盖此境朱砂印';
        stampBtn.classList.add('stamped');
        sealVisual.classList.add('stamped-active');
      } else {
        stampBtn.innerHTML = '💮 钤印留念 · 盖上此城山海印';
        stampBtn.classList.remove('stamped');
        sealVisual.classList.remove('stamped-active');
      }
    }
  }

  private render() {
    const d = this.currentDest;

    const allPhotos: { url: string; caption: string }[] = [
      { url: d.heroImage, caption: d.heroImageCaption || `${d.modernName} 主胜景` },
      ...(d.galleryImages || []).map((imgUrl, i) => ({
        url: imgUrl,
        caption: (d.galleryCaptions && d.galleryCaptions[i]) || `${d.modernName} 角度 ${i + 1}`
      }))
    ];

    const currentCaptionObj = allPhotos.find(p => p.url === this.activeHeroImage) || allPhotos[0];
    const currentCaption = currentCaptionObj.caption;

    this.element.innerHTML = `
      <div class="daily-stage-container">
        <!-- Header Banner with Element Theme -->
        <div class="daily-stage-header">
          <div class="element-badge element-${d.element}">
            <span>${d.region.label}</span>
            <span class="dot-divider">·</span>
            <span>${d.solarTerm}</span>
          </div>
          <div class="ancient-scroll-tag">《新山海图志 · 岁时流转》</div>
        </div>

        <h2 class="section-main-title">
          以山海之墨 · 绘当前样板万象风光
        </h2>
        <p class="section-main-desc">
          今日当值胜境：【${d.cityName} · ${d.ancientMythicName}】—— ${d.modernName}
        </p>

        <!-- 1. 真 3D 悬浮花灯画廊 (3D Floating Winged Lantern Gallery) -->
        <div class="scenic-lantern-stage" id="daily-hero-frame">
          <!-- 3D 背景五行流光与走马灯转轴光晕 -->
          <div class="altar-ambient-aura element-aura-${d.element}"></div>
          
          <!-- 走马花灯 3D 空间交互舞台 (支持直接鼠标/触控左右任意拖拽滑动) -->
          <div class="lantern-3d-scene" id="lantern-drag-scene">
            <!-- 走马花灯环形旋转转盘 (Carousel Ring) -->
            <div class="lantern-carousel-ring" id="lantern-carousel-ring">
              ${allPhotos.map((photo, idx) => `
                <div class="lantern-facet-card ${idx === 0 ? 'active' : ''}" data-index="${idx}" data-url="${photo.url}" data-caption="${photo.caption}">
                  <div class="facet-artwork-frame">
                    <img src="${photo.url}" alt="${photo.caption}" class="facet-img" draggable="false" />
                    <!-- 镂空泥金如意四角 -->
                    <div class="frame-ruyi-corner corner-tl"></div>
                    <div class="frame-ruyi-corner corner-tr"></div>
                    <div class="frame-ruyi-corner corner-bl"></div>
                    <div class="frame-ruyi-corner corner-br"></div>

                    <!-- 4K 沉浸入画按钮 -->
                    <button class="facet-inspect-btn" data-url="${photo.url}" data-caption="${photo.caption}" title="全屏 4K 沉浸鉴赏">
                      <span>🔍 4K 鉴赏</span>
                    </button>
                  </div>
                  <div class="facet-label-pill">0${idx + 1} · ${photo.caption.split('·')[0].trim()}</div>
                </div>
              `).join('')}
            </div>

            <!-- 极简半透明手势滑动提示指示器 -->
            <div class="lantern-swipe-hint">
              <span class="hint-arrow">‹</span>
              <span class="hint-text">按住任意左右滑动转动花灯</span>
              <span class="hint-arrow">›</span>
            </div>
          </div>

          <!-- 3D 悬浮金石标题台 (动态响应当前面向用户的花灯面) -->
          <div class="scenic-spatial-pedestal" id="daily-landscape-badge">
            <div class="pedestal-tag-pill">
              <span class="pulse-dot"></span>
              <span id="daily-photo-idx-badge">01 / 0${allPhotos.length}</span>
              <span class="dot-sep">·</span>
              <span>宣和走马花灯 · 3D 旋转实景</span>
            </div>
            <h3 class="pedestal-title" id="daily-photo-title">${currentCaption}</h3>
            <div class="pedestal-season">🍂 胜赏岁时：${d.bestSeason}</div>
          </div>
        </div>

        <!-- Fullscreen Lightbox Modal (Hidden by default) -->
        <div class="daily-scenic-lightbox-modal" id="daily-scenic-lightbox" style="display: none;">
          <div class="lightbox-backdrop" id="lightbox-backdrop"></div>
          <button class="lightbox-close-btn" id="lightbox-close-btn" title="收起画境 · 返回画卷">✕</button>
          
          <div class="lightbox-viewport-container">
            <img src="${this.activeHeroImage}" alt="${currentCaption}" class="lightbox-main-img" id="lightbox-main-img" />
          </div>

          <div class="lightbox-bottom-card">
            <div class="lightbox-badge-gold">宣和纪实 · 4K 原图真赏</div>
            <h3 class="lightbox-caption" id="lightbox-caption-title">${currentCaption}</h3>
            <p class="lightbox-meta">📍 ${d.cityName} · ${d.ancientMythicName} ｜ 🏛️ ${d.modernName}</p>
          </div>
        </div>

        <!-- 3. Dual-Perspective Lore Columns (直接衔接文脉双栏，已删去多余的下方缩略图栏) -->
        <div class="dual-lore-grid">
          <!-- Column A: Ancient Shan Hai Jing Lore -->
          <div class="lore-col mythic-lore-col">
            <div class="col-header">
              <span class="col-icon">📜</span>
              <h3>《山海异志》考纪</h3>
            </div>
            <div class="lore-poem-box">
              <p class="poem-text">${d.mythicPoem.replace(/\n/g, '<br/>')}</p>
            </div>
            <p class="lore-body-text">${d.mythicLore}</p>
            
            <!-- Guardian Beast Box -->
            <div class="guardian-spirit-card">
              <div class="guardian-top">
                <span class="guardian-icon" style="display: inline-flex; align-items: center; justify-content: center;">${getBeastSvgIcon(d.guardian.name, '#FFD700', 24)}</span>
                <div>
                  <h4 class="guardian-name">${d.guardian.name} <span class="guardian-title">【${d.guardian.title}】</span></h4>
                  <div class="guardian-power">⚡ 司掌神能：${d.guardian.domainPower}</div>
                </div>
              </div>
              <blockquote class="guardian-quote">"${d.guardian.classicQuote}"</blockquote>
            </div>
          </div>

          <!-- Column B: Real Geographic & Geological Science -->
          <div class="lore-col real-geo-col">
            <div class="col-header">
              <span class="col-icon">🔬</span>
              <h3>真实地理实纪 · 地质科考百科</h3>
            </div>
            
            <div class="geo-fact-card">
              <div class="geo-row">
                <span class="geo-key">🌍 地理区位：</span>
                <span class="geo-val">${d.region.label}（经纬度：${d.coordinates.lat}°N, ${d.coordinates.lng}°E）</span>
              </div>
              <div class="geo-row">
                <span class="geo-key">⛰️ 地质成因：</span>
                <span class="geo-val">${d.geologyType}</span>
              </div>
              <div class="geo-row">
                <span class="geo-key">📅 最佳时节：</span>
                <span class="geo-val">${d.bestSeason}</span>
              </div>
              <div class="geo-row">
                <span class="geo-key">🏷️ 胜景类型：</span>
                <span class="geo-val">${d.landscapeTag}</span>
              </div>
            </div>

            <p class="real-history-text">${d.realHistory}</p>

            <!-- 4. Interactive Vermilion Seal Stamp Box -->
            <div class="stamp-interactive-box">
              <div class="stamp-display-area">
                <div class="seal-stamp-visual ${this.isStamped ? 'stamped-active' : ''}" id="daily-seal-stamp" style="border-color:${d.seal.inkColor}; color:${d.seal.inkColor};">
                  <div class="seal-border">
                    <span class="seal-script">${d.seal.sealScript}</span>
                  </div>
                </div>
                <div class="stamp-desc">
                  <strong>${d.seal.sealName}</strong>
                  <p>点击下方盖印，将此地市印章永久载入您的《山海通关文牒》</p>
                </div>
              </div>

              <button class="stamp-trigger-btn ${this.isStamped ? 'stamped' : ''}" id="stamp-action-btn">
                ${this.isStamped ? '✨ 岁月铭刻 · 已钤盖此境朱砂印' : '💮 钤印留念 · 盖上此城山海印'}
              </button>
            </div>
          </div>
        </div>

        <!-- 5. Traveler Note Journal -->
        <div class="traveler-note-box">
          <div class="note-header">
            <span>🖋️ 行者游历心迹</span>
            <span class="note-tip">（记录您的感悟或游历备忘，本地持久存储）</span>
          </div>
          <textarea id="traveler-note-input" class="note-textarea" placeholder="在此写下您对【${d.modernName}】的旅行愿望或游记见闻...">${this.savedNote}</textarea>
          <div class="note-footer">
            <button class="save-note-btn" id="save-note-btn">💾 保存游历笔记</button>
            <span class="save-hint" id="save-hint-text"></span>
          </div>
        </div>
      </div>
    `;

    // 1. 古代走马花灯 3D 四方悬浮环 (Quad/Polygon 3D Lantern Carousel)
    // 布局结构：
    //       【北面 / 远景背部】
    // 【西面 / 左翼】      【东面 / 右翼】
    //       【南面 / 正中主图】
    let currentIndex = 0;
    const totalCount = allPhotos.length;
    const scene = this.element.querySelector('#lantern-drag-scene') as HTMLElement;
    const ring = this.element.querySelector('#lantern-carousel-ring') as HTMLElement;
    const titleEl = this.element.querySelector('#daily-photo-title') as HTMLElement;
    const idxBadge = this.element.querySelector('#daily-photo-idx-badge') as HTMLElement;
    const facets = this.element.querySelectorAll('.lantern-facet-card');

    // 经典花灯正方形/菱形悬浮距离：
    // 正面 Z: 0, scale: 1
    // 左侧 X: -360px, Z: -160px, rotateY: 38deg, scale: 0.8
    // 右侧 X: 360px, Z: -160px, rotateY: -38deg, scale: 0.8
    // 背部 Z: -320px, scale: 0.65, opacity: 0.2
    let mouseTiltX = 0;
    let mouseTiltY = 0;

    const renderLanternPositions = (rotOffsetDeg = 0) => {
      facets.forEach((f, i) => {
        const facetEl = f as HTMLElement;
        // 计算当前面相对于当前焦点的相对步数 (-1, 0, 1, 2...)
        let relStep = (i - currentIndex) % totalCount;
        if (relStep > totalCount / 2) relStep -= totalCount;
        if (relStep < -totalCount / 2) relStep += totalCount;

        // 根据相对步数分配真 3D 空间坐标（使用 translateX(-50%) 配合 left: 50% 保证各种宽度自然长宽比照片均绝对居中）
        if (relStep === 0) {
          // 【南面 / 正面当前主图】：居中、前方、全高清、100% 不透明
          facetEl.style.transform = `translateX(-50%) translate3d(0px, 0px, 40px) rotateY(${mouseTiltY + rotOffsetDeg}deg) rotateX(${mouseTiltX}deg) scale(1)`;
          facetEl.style.opacity = '1';
          facetEl.style.zIndex = '20';
          facetEl.style.filter = 'brightness(1) saturate(1)';
          facetEl.style.pointerEvents = 'auto';
          facetEl.classList.add('active');
        } else if (relStep === 1 || (totalCount === 2 && relStep === -1)) {
          // 【东面 / 右翼照片】：悬浮在右侧，向内微倾 32度，具有纵深
          facetEl.style.transform = `translateX(-50%) translate3d(360px, 0px, -140px) rotateY(${-34 + rotOffsetDeg}deg) scale(0.82)`;
          facetEl.style.opacity = '0.68';
          facetEl.style.zIndex = '10';
          facetEl.style.filter = 'brightness(0.7) saturate(0.85)';
          facetEl.style.pointerEvents = 'auto';
          facetEl.classList.remove('active');
        } else if (relStep === -1) {
          // 【西面 / 左翼照片】：悬浮在左侧，向内微倾 -32度，具有纵深
          facetEl.style.transform = `translateX(-50%) translate3d(-360px, 0px, -140px) rotateY(${34 + rotOffsetDeg}deg) scale(0.82)`;
          facetEl.style.opacity = '0.68';
          facetEl.style.zIndex = '10';
          facetEl.style.filter = 'brightness(0.7) saturate(0.85)';
          facetEl.style.pointerEvents = 'auto';
          facetEl.classList.remove('active');
        } else {
          // 【北面 / 远景后方照片】：深邃悬浮在背后，虚化微透
          facetEl.style.transform = `translateX(-50%) translate3d(0px, -20px, -320px) rotateY(${rotOffsetDeg}deg) scale(0.68)`;
          facetEl.style.opacity = '0.25';
          facetEl.style.zIndex = '2';
          facetEl.style.filter = 'brightness(0.4) blur(2px)';
          facetEl.style.pointerEvents = 'none';
          facetEl.classList.remove('active');
        }
      });
    };

    const updateLantern = (index: number) => {
      currentIndex = (index + totalCount) % totalCount;
      facets.forEach(f => { (f as HTMLElement).style.transition = 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)'; });
      renderLanternPositions(0);

      const currentPhoto = allPhotos[currentIndex];
      this.activeHeroImage = currentPhoto.url;
      if (titleEl) titleEl.textContent = currentPhoto.caption;
      if (idxBadge) idxBadge.textContent = `0${currentIndex + 1} / 0${totalCount}`;
    };

    // 初始渲染与侧翼卡片点击直达
    facets.forEach((f, i) => {
      const facetEl = f as HTMLElement;
      facetEl.addEventListener('click', (e) => {
        if (i !== currentIndex) {
          e.stopPropagation();
          updateLantern(i);
        }
      });
    });

    updateLantern(0);

    // 2. 鼠标悬浮 3D 视差微倾斜 (Gyro / Parallax 跟随鼠标)
    if (scene) {
      scene.addEventListener('mousemove', (e: MouseEvent) => {
        if (isDragging) return;
        const rect = scene.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseTiltX = -(y / (rect.height / 2)) * 7; // 最大俯仰 7度
        mouseTiltY = (x / (rect.width / 2)) * 9;  // 最大左右 9度
        
        facets.forEach(f => { (f as HTMLElement).style.transition = 'transform 0.12s ease-out'; });
        renderLanternPositions(0);
      });

      scene.addEventListener('mouseleave', () => {
        mouseTiltX = 0;
        mouseTiltY = 0;
        facets.forEach(f => { (f as HTMLElement).style.transition = 'transform 0.4s ease-out'; });
        renderLanternPositions(0);
      });
    }

    // 3. 鼠标/触控高灵敏度拖拽滑动 (Drag & Swipe to rotate)
    let startX = 0;
    let isDragging = false;

    if (scene) {
      scene.addEventListener('mousedown', (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.facet-inspect-btn')) return;
        isDragging = true;
        startX = e.clientX;
        facets.forEach(f => { (f as HTMLElement).style.transition = 'none'; });
      });

      window.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        // 拖拽跟随动态角位移
        const rotOffsetDeg = deltaX * 0.15;
        renderLanternPositions(rotOffsetDeg);
      });

      window.addEventListener('mouseup', (e: MouseEvent) => {
        if (!isDragging) return;
        isDragging = false;
        const deltaX = e.clientX - startX;
        if (deltaX > 40) {
          updateLantern(currentIndex - 1); // 顺时针旋转切换至上一张
        } else if (deltaX < -40) {
          updateLantern(currentIndex + 1); // 逆时针旋转切换至下一张
        } else {
          updateLantern(currentIndex); // 弹性回归
        }
      });

      scene.addEventListener('touchstart', (e: TouchEvent) => {
        if ((e.target as HTMLElement).closest('.facet-inspect-btn')) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        facets.forEach(f => { (f as HTMLElement).style.transition = 'none'; });
      }, { passive: true });

      scene.addEventListener('touchmove', (e: TouchEvent) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        renderLanternPositions(deltaX * 0.15);
      }, { passive: true });

      scene.addEventListener('touchend', (e: TouchEvent) => {
        if (!isDragging) return;
        isDragging = false;
        const deltaX = e.changedTouches[0].clientX - startX;
        if (deltaX > 35) {
          updateLantern(currentIndex - 1);
        } else if (deltaX < -35) {
          updateLantern(currentIndex + 1);
        } else {
          updateLantern(currentIndex);
        }
      });
    }

    // 3. 4K 全屏灯箱 (Lightbox)
    const lightboxModal = this.element.querySelector('#daily-scenic-lightbox') as HTMLElement;
    const lightboxImg = this.element.querySelector('#lightbox-main-img') as HTMLImageElement;
    const lightboxCaption = this.element.querySelector('#lightbox-caption-title') as HTMLElement;

    const openLightbox = (url: string, caption: string) => {
      if (lightboxModal && lightboxImg) {
        lightboxImg.src = url;
        if (lightboxCaption) lightboxCaption.textContent = caption;
        lightboxModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    };

    const closeLightbox = () => {
      if (lightboxModal) {
        lightboxModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    };

    this.element.querySelectorAll('.facet-inspect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const url = el.dataset.url || this.activeHeroImage;
        const caption = el.dataset.caption || currentCaption;
        openLightbox(url, caption);
      });
    });

    this.element.querySelector('#lightbox-close-btn')?.addEventListener('click', closeLightbox);
    this.element.querySelector('#lightbox-backdrop')?.addEventListener('click', closeLightbox);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal && lightboxModal.style.display !== 'none') {
        closeLightbox();
      }
    });

    // 4. Bind Stamp Action
    this.element.querySelector('#stamp-action-btn')?.addEventListener('click', () => {
      this.onStampClick(d.id);
    });

    // 5. Bind Note Save
    this.element.querySelector('#save-note-btn')?.addEventListener('click', () => {
      const input = this.element.querySelector('#traveler-note-input') as HTMLTextAreaElement;
      if (input) {
        this.onSaveNote(d.id, input.value);
        const hint = this.element.querySelector('#save-hint-text');
        if (hint) {
          hint.textContent = '✅ 笔记已保存至本地文牒！';
          setTimeout(() => { hint.textContent = ''; }, 3000);
        }
      }
    });
  }
}
