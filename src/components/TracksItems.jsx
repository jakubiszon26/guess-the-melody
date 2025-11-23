import {Item, ItemMedia, ItemContent} from "@/components/ui/item"
import {Avatar, AvatarImage} from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

function TrackSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

const TracksItems = (props) => {
    const {tracks, tracksIsLoading} = props;
   
    if(tracksIsLoading) {
      return (
        <div className="space-y-3 p-3">
            {Array.from({ length: 10 }).map((_, i) => (<TrackSkeleton key={i}/>))}
        </div>
      )
    }
    if(tracks && tracks.items) {
      return(
        <div className="space-y-3 p-3">
           {tracks.items.map((p) => (
                          <Item key={p.track.id} variant="outline" className="m-0">
                            <ItemMedia>
                              <Avatar variant="square">
                                <AvatarImage src={p.track.album.images[0]?.url} />
                              </Avatar>
                            </ItemMedia>
                            <ItemContent>{p.track.name}</ItemContent>
                          </Item>
                        ))}
        </div>
      )
    }




}
export default TracksItems;