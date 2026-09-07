import type { DestinationItem, RegionReference } from '../types';
import { getBeastSvgIcon } from './MythicBeastIcons';

export class GuangdongGallerySection {
  private element: HTMLElement;
  private destinations: DestinationItem[];
  private currentFilter: 'all' | RegionReference['key'] = 'all';
  private stampedSet: Set<string>;
  private onSelectDestination: (dest: DestinationItem) => void;

  constructor(
    destinations: DestinationItem[],
    stampedIds: string[],
    onSelectDestination: (dest: DestinationItem) => void
  ) {
    this.destinations = destinations;
    this.stampedSet = new Set(stampedIds);
    this.onSelectDestination = onSelectDestination;

    this.element = document.createElement('section');
    this.element.id = 'gallery-stage';
    this.element.className = 'gallery-section';
    this.render();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateStamped(stampedIds: string[]) {
    this.stampedSet = new Set(stampedIds);
    this.render();
  }

  private render() {
    const regionFilterOptions = [
      { key: 'pearl_river_delta', icon: '🌊', label: '珠三角广府灵域' },
      { key: 'chaoshan_east', icon: '🏮', label: '粤东潮汕海陆' },
      { key: 'leizhou_west', icon: '🏝️', label: '粤西雷州碧海' },
      { key: 'nanling_north', icon: '⛰️', label: '粤北南岭叠嶂' },
      { key: 'jiangnan_waters', icon: '🌿', label: '江南水乡样板' }
    ].filter(option => this.destinations.some(destination => destination.region.key === option.key));

    const filtered = this.currentFilter === 'all'
      ? this.destinations
      : this.destinations.filter(d => d.region.key === this.currentFilter);

    this.element.innerHTML = `
      <div class="gallery-container">
        <!-- Section Header -->
        <div class="section-badge-center">
          <span class="badge-icon">🏮</span> 山海画廊 · 已收录地域风光
        </div>
        <h2 class="section-main-title">
          以山海之墨 · 尽览当前样板万象风光
        </h2>
        <p class="section-main-desc">
          通过唯一目的地目录，逐步收录真实地理、文化景观、摄影素材与对应守护叙事
        </p>

        <!-- Region filter tabs are derived from the canonical catalog. -->
        <div class="continent-filter-tabs">
          <button class="filter-tab-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-region="all">
            <span class="tab-icon">🌟</span> 全部已收录 (${this.destinations.length})
          </button>
          ${regionFilterOptions.map(option => {
            const count = this.destinations.filter(destination => destination.region.key === option.key).length;
            return `
              <button class="filter-tab-btn ${this.currentFilter === option.key ? 'active' : ''}" data-region="${option.key}">
                <span class="tab-icon">${option.icon}</span> ${option.label} (${count})
              </button>
            `;
          }).join('')}
        </div>

        <!-- Canonical high-definition scenic card grid -->
        <div class="scenic-cards-grid">
          ${filtered.map(dest => {
            const isStamped = this.stampedSet.has(dest.id);
            return `
              <div class="scenic-card" data-id="${dest.id}">
                <div class="card-img-wrapper">
                  <img src="${dest.heroImage}" alt="${dest.modernName}" class="card-img" loading="lazy" />
                  <div class="card-gradient-overlay"></div>
                  
                  <span class="card-element-tag element-${dest.element}">
                    ${dest.region.label}
                  </span>

                  <div class="card-caption-tag">
                    📷 ${dest.heroImageCaption || dest.modernName}
                  </div>

                  ${isStamped ? `<span class="card-stamped-badge">💮 已盖印</span>` : ''}

                  <div class="card-guardian-floating">
                    <span class="g-icon" style="display: inline-flex; align-items: center; justify-content: center;">${getBeastSvgIcon(dest.guardian.name, '#FFD700', 16)}</span>
                    <span class="g-name">${dest.guardian.name}</span>
                  </div>
                </div>

                <div class="card-content">
                  <div class="card-top-meta">
                    <span class="card-city-badge">${dest.cityName}</span>
                    <span class="card-tag">${dest.landscapeTag}</span>
                  </div>
                  <h3 class="card-ancient-title">${dest.ancientMythicName}</h3>
                  <h4 class="card-modern-title">${dest.modernName}</h4>
                  
                  <p class="card-poem-snippet">"${dest.mythicPoem.split('\n')[0]}"</p>
                  
                  <div class="card-bottom-bar">
                    <span class="card-season">🍂 ${dest.bestSeason.split('·')[0]}</span>
                    <button class="card-fly-btn" data-id="${dest.id}">
                      3D 运镜至此 ✈️
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Bind Filter Tabs
    this.element.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const region = (e.currentTarget as HTMLElement).dataset.region as 'all' | RegionReference['key'];
        this.currentFilter = region;
        this.render();
      });
    });

    // Bind Card Click -> Fly to City & Focus
    this.element.querySelectorAll('.scenic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const cityId = (e.currentTarget as HTMLElement).dataset.id;
        const dest = this.destinations.find(d => d.id === cityId);
        if (dest) {
          this.onSelectDestination(dest);
        }
      });
    });
  }
}
