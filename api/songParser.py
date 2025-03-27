from html.parser import HTMLParser

class SongParser(HTMLParser):

    def __init__(self):
        HTMLParser.__init__(self)
        self.lyrics=[]
        self.currentData=""
        self.currentParams=[]
        self.currentBpm = 120
        self.currentStretch = 50

    def handle_starttag(self, tag, attrs):
        nattr={}
        for attr in attrs:
            nattr[attr[0]]=attr[1]
        if tag != "lyric":
            self.currentParams.append({"t":tag,"a":nattr})
        else:
            if "bpm" in nattr:
                self.currentBpm = int(nattr["bpm"])
            if "stretch" in nattr:
                self.currentStretch = int(nattr["stretch"])

    def handle_endtag(self, tag):
        if tag == "lyric":
            self.lyrics.append({"data":self.currentData,"params":self.currentParams,"bpm":self.currentBpm,"stretch":self.currentStretch})
            self.currentData=""
            self.currentParams=[]

    def handle_data(self, data):
        self.currentData+=data

    def getSong(self):
        return self.lyrics