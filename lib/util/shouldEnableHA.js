const __BROWSER__ = (typeof window === 'object');

function isMobile(userAgent) {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  ).test(userAgent);
}

function isGingerbread(userAgent) {
  return (/Android 2\.3\.[3-7]/i).test(userAgent);
}

export default function shouldEnableHA() {
  if(!__BROWSER__) {
    return false;
  }
  const { userAgent } = navigator;
  if(!userAgent) {
    return false;
  }
  if(isMobile(userAgent) && !isGingerbread(userAgent)) {
    return true;
  }
  return false;
}
