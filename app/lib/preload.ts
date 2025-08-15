import { getUser } from "./actions/user/actions"
import 'server-only'



export const preload = async () => {
  void getUser()
}

