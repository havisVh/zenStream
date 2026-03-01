interface HSAPElementSettings {
  className?: string;
  id?: string;
  transitionProperty?: string;
  intersectionRatio: [number, number];
  transitionValue: [number, number];
  transitionUnit?: string;
}

interface IntersectionProp {
  root: Element | null;
  rootMargin?: string;
  scrollMargin?: string;
  threshold: number | number[];
}

class HSAP {
  private intersectionOBS: IntersectionObserver;

  constructor(elementSettings: HSAPElementSettings, prop: IntersectionProp) {
    this.intersectionOBS = new IntersectionObserver(
      this.handleIntersect.bind(this),
      {
        root: prop.root,
        rootMargin: prop.rootMargin || "0px",
        scrollMargin: prop.scrollMargin || "0px",
        threshold: prop.threshold,
      },
    );

    console.log("HSAP Ready");
  }

  private handleIntersect(
    entries: IntersectionObserverEntry[],
    observer: IntersectionObserver,
  ) {
    entries.forEach((entry) => {
      if (
        entry.target.classList.contains(this.elementSettings.className || "") ||
        entry.target.id === this.elementSettings.id
      ) {
        console.log(
          "Intersecting:",
          entry.target,
          "Ratio:",
          entry.intersectionRatio,
        );
        const ratio = entry.intersectionRatio;
        const [minRatio, maxRatio] = this.elementSettings.intersectionRatio;
        const [minValue, maxValue] = this.elementSettings.transitionValue;

        if (ratio >= minRatio && ratio <= maxRatio) {
          const progress = (ratio - minRatio) / (maxRatio - minRatio);
          const currentValue = this.interpolate(minValue, maxValue, progress);
          entry.target.style[this.elementSettings.transitionProperty] =
            currentValue + (this.elementSettings.transitionUnit || "");
        }
      }
    });
  }
}

export { HSAP, HSAPElementSettings, IntersectionProp };
