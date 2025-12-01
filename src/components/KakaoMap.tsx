import { useEffect, useRef } from 'react'

interface KakaoMapProps {
  address: string
  width?: string
  height?: string
}

const KAKAO_API_KEY = '3e65c6a3bae4be4bbb1e8501154624fc' // 재발급 받은 키로 교체

const KakaoMap = ({ address, width = '100%', height = '300px' }: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!address) return
    if (!(window as any).kakao) {
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3e65c6a3bae4be4bbb1e8501154624fc&autoload=false&libraries=services`
      script.async = true
      script.onload = () => {
        (window as any).kakao.maps.load(() => renderMap())
      }
      document.body.appendChild(script)
    } else {
      (window as any).kakao.maps.load(() => renderMap())
    }

    function renderMap() {
      if (!mapRef.current) return
      const kakao = (window as any).kakao
      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3
      })
      const geocoder = new kakao.maps.services.Geocoder()
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x)
          map.setCenter(coords)
          new kakao.maps.Marker({ map, position: coords })
        }
      })
    }
  }, [address])

  return <div ref={mapRef} style={{ width, height }} />
}

export default KakaoMap
